from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

from skforecast.recursive import ForecasterRecursive
from skforecast.model_selection import TimeSeriesFold, backtesting_forecaster

from lightgbm import LGBMRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, r2_score

app = Flask(__name__)
CORS(app)


def train_and_evaluate(name, regressor, y):

    forecaster = ForecasterRecursive(
        estimator=regressor,
        lags=15
    )

    cv = TimeSeriesFold(
        steps=12,
        initial_train_size=len(y) - 12,
        refit=False
    )

    metric, predictions = backtesting_forecaster(
        forecaster=forecaster,
        y=y,
        cv=cv,
        metric="mean_squared_error",
        show_progress=False
    )

    # Alignement des vraies valeurs
    y_true = y.loc[predictions.index]

    # Utiliser uniquement la colonne des prédictions
    y_pred = predictions["pred"]

    rmse = np.sqrt(mean_squared_error(y_true.values, y_pred.values))
    r2 = r2_score(y_true.values, y_pred.values)

    # entraînement final
    forecaster.fit(y=y)

    future = forecaster.predict(steps=12)

    return {
        "name": name,
        "rmse": float(rmse),
        "r2": float(r2),
        "forecast": future.values.tolist(),
        "dates": future.index.strftime("%Y-%m-%d").tolist()
    }


@app.route("/predict", methods=["POST"])
def predict():

    try:

        file = request.files["file"]
        date_col = request.form["date_col"]
        target_col = request.form["target_col"]

        # lecture fichier
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)

        # convertir date
        df[date_col] = pd.to_datetime(df[date_col])

        # garder seulement les colonnes utiles
        df = df[[date_col, target_col]]

        # supprimer doublons
        df = df.groupby(date_col)[target_col].mean().reset_index()

        # trier
        df = df.sort_values(date_col)

        # index temporel
        df = df.set_index(date_col)

        # fréquence
        freq = pd.infer_freq(df.index)

        if freq is None:
            freq = "D"

        df = df.asfreq(freq)

        # remplir NaN
        df[target_col] = df[target_col].ffill()

        y = df[target_col]

        models = [
            ("LightGBM", LGBMRegressor(random_state=123, verbose=-1)),
            ("RandomForest", RandomForestRegressor(random_state=123)),
            ("Ridge", Ridge())
        ]

        results = []

        for name, model in models:
            results.append(train_and_evaluate(name, model, y))

        best = min(results, key=lambda x: x["rmse"])

        return jsonify({

            "history": {
                "dates": y.index.strftime("%Y-%m-%d").tolist(),
                "values": y.values.tolist()
            },

            "models": [
                {"name": r["name"], "rmse": r["rmse"], "r2": r["r2"]}
                for r in results
            ],

            "best_model": {
                "name": best["name"],
                "forecast_values": best["forecast"],
                "forecast_dates": best["dates"]
            }

        })

    except Exception as e:

        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    import os
    # Récupère le port de Render, sinon 5000 par défaut
    port = int(os.environ.get("PORT", 5000))
    # host='0.0.0.0' est obligatoire pour que le serveur soit accessible de l'extérieur
    app.run(host='0.0.0.0', port=port)
import { useState } from "react";
import { Loader2, Trophy, BarChart3, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FileUploadZone from "@/components/FileUploadZone";
import ForecastChart from "@/components/ForecastChart";

interface ModelMetric {
  name: string;
  rmse: number;
  r2: number;
}

interface ApiResponse {
  history: { dates: string[]; values: number[] };
  models: ModelMetric[];
  best_model: {
    name: string;
    forecast_values: number[];
    forecast_dates: string[];
  };
}

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [dateCol, setDateCol] = useState("");
  const [targetCol, setTargetCol] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  const handleFileSelect = async (f: File) => {
    setFile(f);
    setResult(null);
    setError("");

    // Parse columns from CSV header
    if (f.name.endsWith(".csv")) {
      const text = await f.text();
      const firstLine = text.split("\n")[0];
      const cols = firstLine.split(",").map((c) => c.trim().replace(/"/g, ""));
      setColumns(cols);
    } else {
      // For xlsx we just let user type or we show a placeholder
      setColumns(["(Charger un .csv pour auto-détecter les colonnes)"]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !dateCol || !targetCol) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("date_col", dateCol);
      formData.append("target_col", targetCol);

      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
      const data: ApiResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Erreur de connexion à l'API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-semibold text-foreground tracking-tight font-mono">
            PDV
          </h1>
          <span className="text-xs text-muted-foreground ml-2">
            Prédiction de séries temporelles
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Step 1: Configuration */}
        {!result && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Chargez vos données et sélectionnez les colonnes
              </p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="pt-6 space-y-6">
                <FileUploadZone onFileSelect={handleFileSelect} />

                {columns.length > 0 && !columns[0].startsWith("(") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Colonne Date
                      </label>
                      <Select value={dateCol} onValueChange={setDateCol}>
                        <SelectTrigger className="bg-muted border-border">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Colonne Valeur
                      </label>
                      <Select value={targetCol} onValueChange={setTargetCol}>
                        <SelectTrigger className="bg-muted border-border">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!file || !dateCol || !targetCol || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compétition en cours...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Lancer la Compétition de Modèles
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Dashboard */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Résultats</h2>
                <p className="text-sm text-muted-foreground">
                  Analyse terminée — meilleur modèle détecté
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setColumns([]);
                  setDateCol("");
                  setTargetCol("");
                }}
              >
                Nouvelle analyse
              </Button>
            </div>

            {/* Best model badge */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6 flex items-center gap-4">
                <Trophy className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Meilleur modèle</p>
                  <Badge className="mt-1 text-base px-3 py-1 bg-accent/15 text-accent border-accent/30 hover:bg-accent/20">
                    {result.best_model.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Metrics table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Comparaison des Modèles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Modèle</TableHead>
                      <TableHead className="text-muted-foreground text-right">RMSE</TableHead>
                      <TableHead className="text-muted-foreground text-right">R²</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.models.map((m) => (
                      <TableRow
                        key={m.name}
                        className={`border-border ${m.name === result.best_model.name ? "bg-accent/5" : ""
                          }`}
                      >
                        <TableCell className="font-mono font-medium">
                          {m.name}
                          {m.name === result.best_model.name && (
                            <Badge variant="outline" className="ml-2 text-xs border-accent/40 text-accent">
                              Best
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {m.rmse.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {m.r2.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Historique & Prévisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ForecastChart
                  historyDates={result.history.dates}
                  historyValues={result.history.values}
                  forecastDates={result.best_model.forecast_dates}
                  forecastValues={result.best_model.forecast_values}
                />
              </CardContent>
            </Card>

            {/* Forecast table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Prévisions Détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground text-right">Valeur Prédite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.best_model.forecast_dates.map((date, i) => (
                      <TableRow key={date} className="border-border">
                        <TableCell className="font-mono text-sm">
                          {date.slice(0, 10)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-accent">
                          {result.best_model.forecast_values[i].toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Activity, Heart, Moon, Brain } from "lucide-react";

const BiometricForm = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    user_name: "",
    age: 30,
    hrv: 60,
    bpm: 75,
    bpm_average: 65,
    sleep_hours: 7,
    cognitive_load: 5
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSliderChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="biometric-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-heading text-white">Dados Biométricos</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Insira seus dados para análise preditiva completa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_name" className="text-xs font-bold uppercase tracking-wider text-neutral-400">Nome</Label>
              <Input
                id="user_name"
                data-testid="input-user-name"
                value={formData.user_name}
                onChange={(e) => setFormData(prev => ({ ...prev, user_name: e.target.value }))}
                className="bg-neutral-950 border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white"
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wider text-neutral-400">Idade</Label>
              <Input
                id="age"
                type="number"
                data-testid="input-age"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 30 }))}
                className="bg-neutral-950 border-white/20 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white"
                min="18"
                max="120"
              />
            </div>
          </div>

          {/* HRV */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                HRV - Variabilidade Cardíaca
              </Label>
              <span className="text-white font-mono text-lg font-bold">{formData.hrv} ms</span>
            </div>
            <Slider
              value={[formData.hrv]}
              onValueChange={(value) => handleSliderChange('hrv', value)}
              min={20}
              max={150}
              step={1}
              data-testid="slider-hrv"
              className="w-full"
            />
            <p className="text-xs text-neutral-500">Valores normais: 50-100ms</p>
          </div>

          {/* BPM Current */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                BPM Atual
              </Label>
              <span className="text-white font-mono text-lg font-bold">{formData.bpm} bpm</span>
            </div>
            <Slider
              value={[formData.bpm]}
              onValueChange={(value) => handleSliderChange('bpm', value)}
              min={40}
              max={180}
              step={1}
              data-testid="slider-bpm"
              className="w-full"
            />
          </div>

          {/* BPM Average */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                BPM Médio em Repouso
              </Label>
              <span className="text-white font-mono text-lg font-bold">{formData.bpm_average} bpm</span>
            </div>
            <Slider
              value={[formData.bpm_average]}
              onValueChange={(value) => handleSliderChange('bpm_average', value)}
              min={40}
              max={100}
              step={1}
              data-testid="slider-bpm-average"
              className="w-full"
            />
          </div>

          {/* Sleep */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Moon className="w-4 h-4 text-blue-400" />
                Horas de Sono
              </Label>
              <span className="text-white font-mono text-lg font-bold">{formData.sleep_hours}h</span>
            </div>
            <Slider
              value={[formData.sleep_hours]}
              onValueChange={(value) => handleSliderChange('sleep_hours', value)}
              min={0}
              max={12}
              step={0.5}
              data-testid="slider-sleep"
              className="w-full"
            />
            <p className="text-xs text-neutral-500">Recomendado: 7-9 horas</p>
          </div>

          {/* Cognitive Load */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Carga Cognitiva
              </Label>
              <span className="text-white font-mono text-lg font-bold">{formData.cognitive_load}/10</span>
            </div>
            <Slider
              value={[formData.cognitive_load]}
              onValueChange={(value) => handleSliderChange('cognitive_load', value)}
              min={0}
              max={10}
              step={1}
              data-testid="slider-cognitive-load"
              className="w-full"
            />
            <p className="text-xs text-neutral-500">0 = Relaxado, 10 = Sobrecarga mental</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/5"
              disabled={isLoading}
              data-testid="cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              disabled={isLoading}
              data-testid="submit-biometrics-button"
            >
              {isLoading ? "Analisando..." : "Analisar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricForm;
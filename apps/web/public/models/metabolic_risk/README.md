# Metabolic Risk V3 Models

Place exported ONNX model files here after running the Colab export script.

## Expected structure

```
public/models/metabolic_risk/
  manifest.json          ← preprocessing params (replace with Colab export)
  T0/
    HighBodyFat_BMI.onnx
    Low_HDL.onnx
    Diabetes.onnx
    NAFLD.onnx
    Hypertension.onnx
    InsulinResistance.onnx
    MetSyn.onnx
  T1/ … T4/  (same label filenames)
```

## Export from Colab

Run `scripts/export_metabolic_risk_models.py` in your V3 notebook environment, or copy the export cells from the integration guide.

The bundled `manifest.json` contains placeholder preprocessing parameters. **Replace it** with values fit on your training split for accurate predictions.

## Privacy

All inference runs in the browser via ONNX Runtime Web — patient biomarker data never leaves the device.

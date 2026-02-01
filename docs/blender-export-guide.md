# Blender to GLB Export - Best Practices Guide

This guide ensures your 3D models export cleanly for the web viewer.

---

## BEFORE EXPORTING

### 1. Clean Up Your Scene

```
Step 1: Delete unwanted objects
- Select objects you DON'T want exported
- Press X → Delete

Step 2: Check for hidden objects
- Press Alt + H to unhide everything
- Delete anything you don't need
```

### 2. Set the Origin Point (Fixes "too far out" issue)

```
Step 1: Select your main object(s)
Step 2: Press Shift + S → Cursor to World Origin
Step 3: Select all objects you want (A or Shift+click)
Step 4: Object → Set Origin → Origin to 3D Cursor

This centers your model at (0,0,0) so it appears centered in the viewer!
```

### 3. Apply Transforms

```
Step 1: Select all objects (A)
Step 2: Press Ctrl + A → All Transforms

This "bakes in" rotation/scale so the model exports correctly.
```

### 4. Check Materials

```
- Use Principled BSDF shader (NOT other shader types)
- Go to Shading workspace to verify
- If using image textures, make sure they're connected to Base Color
```

---

## EXPORT SETTINGS

**File → Export → glTF 2.0 (.glb/.gltf)**

| Setting | Value | Why |
|---------|-------|-----|
| **Format** | glTF Binary (.glb) | Single file, embedded textures |
| **Include → Selected Objects** | ON | Only exports what you selected! |
| **Include → Cameras** | OFF | Viewer has its own camera |
| **Include → Lights** | OFF | Viewer has its own lighting |
| **Transform → +Y Up** | ON | Web standard orientation |
| **Geometry → Apply Modifiers** | ON | Bakes modifiers into mesh |
| **Geometry → UVs** | ON | Needed for textures |
| **Geometry → Normals** | ON | Smooth shading |
| **Materials → Export** | ON | Keep your materials |
| **Images → Format: Auto** | ON | Embeds textures |
| **Compression** | ON (optional) | Smaller files with Draco |

---

## QUICK EXPORT WORKFLOW

```
1. Hide everything you don't want: H key
2. Select only what you want: Shift+click or Box select
3. Center it: Shift+S → Cursor to Origin, then Object → Set Origin → Origin to 3D Cursor
4. Apply transforms: Ctrl+A → All Transforms
5. Export: File → Export → glTF 2.0
6. Check "Selected Objects" in export panel
7. Uncheck Cameras and Lights
8. Export!
```

---

## FILE SIZE GUIDELINES

| Model Type | Target Size | Max Size |
|------------|-------------|----------|
| Simple prop (pizza, mouse) | < 1MB | 2MB |
| Weapon/vehicle | 2-5MB | 10MB |
| Environment scene | 5-15MB | 25MB |

### If File Too Big:

| Issue | Solution |
|-------|----------|
| Huge textures | Image → Scale to 2048x2048 or 1024x1024 |
| Too many polygons | Add Decimate modifier (ratio 0.3-0.5) |
| Enable compression | Check "Compression" in export settings (Draco) |

---

## COMMON ISSUES & FIXES

### "Model appears too far away"
**Cause:** Origin point not at center
**Fix:** Shift+S → Cursor to World Origin, then Object → Set Origin → Origin to 3D Cursor

### "Extra objects I didn't want"
**Cause:** Didn't use "Selected Objects" option
**Fix:** Select only what you want, enable "Selected Objects" in export panel

### "Textures missing / model is gray"
**Cause:** Materials not using Principled BSDF, or textures not packed
**Fix:**
1. Convert materials to Principled BSDF
2. File → External Data → Pack All Into .blend (before exporting)

### "Model is rotated weird"
**Cause:** Transforms not applied
**Fix:** Select all, Ctrl+A → All Transforms

### "Cameras/lights showing in viewer"
**Cause:** Exported with cameras/lights
**Fix:** Uncheck "Cameras" and "Lights" in export panel

---

## VERIFICATION

After exporting, test your GLB:

1. **Online viewer:** https://gltf-viewer.donmccurdy.com/
   - Drag your .glb file into the browser
   - Check textures, scale, and orientation

2. **Local test:**
   - Run `npx serve` in your project folder
   - Open `http://localhost:3000/viewer.html`

---

## EXPORT CHECKLIST

Before each export, verify:

- [ ] Deleted/hidden unwanted objects
- [ ] Origin set to world center (0,0,0)
- [ ] Transforms applied (Ctrl+A)
- [ ] Materials use Principled BSDF
- [ ] Textures are packed or embedded
- [ ] "Selected Objects" checked in export
- [ ] "Cameras" unchecked
- [ ] "Lights" unchecked
- [ ] File size is reasonable

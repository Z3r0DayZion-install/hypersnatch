import os
import zipfile

_script_dir = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(_script_dir, "HyperSnatch_Modular_Source")
out = os.path.join(_script_dir, "HyperSnatch_Modular_Source.zip")

with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
    for dirpath, _, filenames in os.walk(root):
        for name in filenames:
            full = os.path.join(dirpath, name)
            arcname = os.path.relpath(full, os.path.dirname(root))
            zf.write(full, arcname)

print(out)

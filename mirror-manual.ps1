# mirror-manual.ps1

# Ruta base del clonado (ajustá si querés otra)
$dir = "repo-manual"
if (Test-Path $dir) { Remove-Item -Recurse -Force $dir }

# Clona el repo principal en modo --mirror
git clone --mirror https://github.com/nixinxcom/NIXINX.git $dir\NIXINX.git

# Push a cada repo espejo
$targets = @{
  "node-htleamington" = "https://github.com/nixinxcom/NODE-HTLeamington.git"
  "node-htwindsor"    = "https://github.com/nixinxcom/NODE-HTWindsor.git"
  "node-elpatron"     = "https://github.com/nixinxcom/NODE-ElPatron.git"
}

Set-Location "$dir\NIXINX.git"

foreach ($name in $targets.Keys) {
  if (-not (git remote | Select-String "^$name$")) {
    git remote add $name $targets[$name]
  }

  Write-Host "`n🔁 Pushing to $name ..."
  git push $name --mirror
}

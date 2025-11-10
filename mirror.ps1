$token = "${process.env.MIRROR_GITHUB_TOKEN}"  # o directamente ponelo como string si lo probás local: "<TU_TOKEN_AQUI>"

$repos = @{
  "NODE-HTLeamington" = "https://x-access-token:$token@github.com/nixinxcom/NODE-HTLeamington.git"
  "NODE-HTWindsor"    = "https://x-access-token:$token@github.com/nixinxcom/NODE-HTWindsor.git"
  "NODE-ElPatron"     = "https://x-access-token:$token@github.com/nixinxcom/NODE-ElPatron.git"
}

# Limpieza previa
if (Test-Path "repo-mirror") { Remove-Item -Recurse -Force "repo-mirror" }

# Clona tipo mirror
git clone --mirror https://x-access-token:$token@github.com/nixinxcom/NIXINX.git repo-mirror
cd repo-mirror

# Push a todos los remotos
foreach ($name in $repos.Keys) {
  git remote add $name $repos[$name]
  Write-Host "Pushing to $name..."
  git push --mirror $name
}

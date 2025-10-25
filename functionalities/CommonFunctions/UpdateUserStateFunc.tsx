interface iUpdateUserState {
    UserState: any;
    keyPath: string;     // Ruta en formato 'Digital.Cookies' o 'User.FirstName'
    updatedValue: any;   // El nuevo valor que deseas establecer
    replace?: boolean;   // Opcional: true para fusionar con el valor existente, false para sobrescribir (por defecto: false)
}
  
export default function UpdateUserState ({UserState, keyPath, updatedValue, replace = false }: iUpdateUserState){
    const keys = keyPath.split('.'); // Dividimos la ruta de clave en niveles
    const lastKey = keys.pop();   // Obtenemos el último nivel para actualizar el valor
    // Clonamos el objeto original para no mutar directamente
    const deepClone = { ...UserState };
    let currentLevel = deepClone;
    keys.forEach((key) => {
        if (!currentLevel[key]) {
        currentLevel[key] = {}; // Inicializamos si no existe
        }
        currentLevel = currentLevel[key];
    });
    // Si la última clave existe y `merge` está activado, fusionamos el contenido existente
    if (lastKey) {
        if (replace || typeof updatedValue !== 'object' || Array.isArray(updatedValue)) {
            currentLevel[lastKey] = updatedValue; // Reemplazar completamente el valor
          } else {
            // Si el valor es un objeto y no se debe reemplazar, hacer una fusión profunda
            currentLevel[lastKey] = { ...currentLevel[lastKey], ...updatedValue };
          }
        }
    // console.log(deepClone)
    return deepClone;
};

/* ─────────────────────────────────────────────────────────
DOC: Actualizar estado de usuario — functionalities/CommonFunctions/UpdateUserStateFunc.tsx
QUÉ HACE:
  Sincroniza eventos de autenticación con el AppContext y persistencia local (cookies/localStorage),
  normalizando UserState y claims.

API / EXPORTS / RUTA:
  — export function updateUserState(input: {
      user: { uid:string; email?:string|null; displayName?:string|null; photoURL?:string|null }
      claims?: Record<string,any>
      persist?: "none"|"local"|"session"|"cookie"       // default: "local"
    }, actions: { setUser: (u:any)=>void; setLoading: (b:boolean)=>void; setError:(e:string|null)=>void }): void

USO (ejemplo completo):
  import { updateUserState } from "@/functionalities/CommonFunctions/UpdateUserStateFunc";
  import { useApp } from "@/context/AppContext";
  const { actions } = useApp();
  updateUserState({ user, claims, persist:"local" }, actions);

NOTAS CLAVE:
  — Idempotencia: no duplicar writes si el UID no cambia.
  — Seguridad: no persistir tokens; solo metadatos básicos; limpiar en signOut.
  — i18n: puedes persistir prefs.locale junto con el usuario.

DEPENDENCIAS:
  "@/context/UserState" · "@/context/AppContext" · storage/cookies helpers
────────────────────────────────────────────────────────── */

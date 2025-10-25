import { FbStorage } from '@/app/lib/services/firebase'
import {
  getStorage, ref, uploadBytes, getDownloadURL, listAll,
  deleteObject, getBlob
} from "firebase/storage";

/* ---------- SUBIR ---------- */
interface IUploadFiles{
  Logo?: Array<any>;
  Files: Array<any>;
  fileTypes: 'Images' | 'Documents' | 'Multimedia' | 'Any';
  path?: string;
  appName: string;
}

async function UploadStorage(props: IUploadFiles): Promise<void> {
  const base = `${props.appName}/${props.fileTypes}/${props.path ? props.path + '/' : ''}`;

  const uploads: Promise<any>[] = [];

  props.Logo?.forEach((logo) => {
    const storageRef = ref(FbStorage, `${base}Logo/${logo.name}`);
    uploads.push(uploadBytes(storageRef, logo.file));
  });

  props.Files.forEach((file) => {
    const storageRef = ref(FbStorage, `${base}${file.name}`);
    uploads.push(uploadBytes(storageRef, file.file));
  });

  await Promise.all(uploads);
}

/* ---------- ESPERAR URLs REDIMENSIONADAS (.webp) ---------- */
interface IGetResizedURLs {
  Files: Array<any>;
  setFiles: React.SetStateAction<any>;
  appName: string;
  fileTypes: 'Images' | 'Documents' | 'Multimedia' | 'Any';
  path?: string;
  resizedPrefix?: string;   // p.ej. 'resized/'
  maxWaitMs?: number;       // default 45s
  pollEveryMs?: number;     // default 1.5s
}

async function GetResizedURLs(opts: IGetResizedURLs): Promise<void> {
  const {
    Files, setFiles, appName, fileTypes, path,
    resizedPrefix = '', maxWaitMs = 45000, pollEveryMs = 1500
  } = opts;

  const base = `${appName}/${fileTypes}/${path ? path + '/' : ''}`;
  // Intentaremos 2 rutas: con y sin prefijo 'resizedPrefix'
  const makeRefs = (storaged_name: string) => [
    ref(FbStorage, `${base}${resizedPrefix}${storaged_name}`),
    ref(FbStorage, `${base}${storaged_name}`)
  ];

  const deadline = Date.now() + maxWaitMs;
  const results = await Promise.all(
    Files.map(async (f) => {
      if (!f.storaged_name) return f;
      let url: string | null = null;

      // Polling hasta que aparezca el archivo redimensionado
      while (!url && Date.now() < deadline) {
        for (const r of makeRefs(f.storaged_name)) {
          try {
            url = await getDownloadURL(r);
            if (url) break;
          } catch {
            // no existe todavía
          }
        }
        if (!url) await new Promise(res => setTimeout(res, pollEveryMs));
      }

      return {
        ...f,
        storaged_url: url || f.storaged_url || '',
        Dcto_url: url || f.Dcto_url || '',
      };
    })
  );

  setFiles(results);
}

/* ---------- OBTENER URLs GENERALES ---------- */
interface IGetURLs{
  storagePath: string;                   // carpeta en storage, p.ej. 'myapp/Images/foo/'
  fileNameToGetURLs?: string[];         // rutas completas o relativas a storagePath
  stateforURLs?: React.SetStateAction<any>;
}

async function GetURLs(props: IGetURLs) {
  const storageRef = ref(FbStorage, props.storagePath);

  if (!props.fileNameToGetURLs || props.fileNameToGetURLs.length === 0) {
    const storageFiles = await listAll(storageRef);
    const urls = await Promise.all(storageFiles.items.map(item => getDownloadURL(item)));
    props.stateforURLs && props.stateforURLs(urls);
    return urls;
  } else {
    const urls = await Promise.all(
      props.fileNameToGetURLs.map(async (name) => {
        const r = name.includes('/') ? ref(storageRef, name) : ref(storageRef, props.storagePath.replace(/\/?$/, '/') + name);
        return getDownloadURL(r);
      })
    );
    props.stateforURLs && props.stateforURLs(urls);
    return urls;
  }
}

/* ---------- OBTENER URL DE UN SOLO ARCHIVO ---------- */
interface IGetURLSingle {
  filePath: string;          // ruta completa en storage
  wait?: boolean;            // poll si no existe aún
  maxWaitMs?: number;
  pollEveryMs?: number;
}

async function GetURLSingle({ filePath, wait = false, maxWaitMs = 30000, pollEveryMs = 1500 }: IGetURLSingle) {
  const r = ref(FbStorage, filePath);     // <- antes usaba getStorage()
  if (!wait) return getDownloadURL(r);
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try { return await getDownloadURL(r); }
    catch (e:any) {
      if (e?.code === 'storage/unauthorized') throw e; // reglas bloquean: no sigas esperando
      await new Promise(res => setTimeout(res, pollEveryMs));
    }
  }
  throw new Error(`Timeout esperando URL de ${filePath}`);
}

/* ---------- ELIMINAR ---------- */
interface IDeleteFiles{
  filePaths: string[];   // rutas completas a borrar
}

async function DeleteStorage(props: IDeleteFiles): Promise<void> {
  await Promise.all(props.filePaths.map(p => deleteObject(ref(FbStorage, p))));
}

/* ---------- DESCARGAR ---------- */
interface IDownloadFiles{
  filePath: string;             // ruta completa
  downloadAsName?: string;      // nombre sugerido
}

async function DownloadStorage(props: IDownloadFiles): Promise<void> {
  const blob = await getBlob(ref(FbStorage, props.filePath));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = props.downloadAsName ?? props.filePath.split('/').pop() ?? 'file';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export {
  UploadStorage,
  GetResizedURLs,
  GetURLs,
  GetURLSingle,
  DownloadStorage,
  DeleteStorage,
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

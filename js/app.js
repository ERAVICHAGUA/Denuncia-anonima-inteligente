const STORAGE_KEY = "denuncias_anonimas_v1";
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const form = document.getElementById("formDenuncia");
const mensaje = document.getElementById("mensaje");
const listaDenuncias = document.getElementById("listaDenuncias");
const btnExport = document.getElementById("btnExport");
const btnClear = document.getElementById("btnClear");
const yearSpan = document.getElementById("year");
if(yearSpan) yearSpan.textContent = new Date().getFullYear();

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => { reader.abort(); reject(new Error("Error leyendo el archivo.")); };
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function showMessage(txt, type = "success") {
  mensaje.textContent = txt;
  mensaje.className = type === "success" ? "success" : "error";
}

function loadDenuncias() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDenuncias(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderDenuncias() {
  const list = loadDenuncias();
  if (!list.length) {
    listaDenuncias.innerHTML = "<p>No hay denuncias registradas (simulado).</p>";
    return;
  }
  let html = `<table>
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Evidencia</th></tr></thead><tbody>`;
  for (const d of list.slice().reverse()) {
    const fecha = new Date(d.fecha).toLocaleString();
    const evidenciaBtn = d.evidencia
      ? `<a href="${d.evidencia.data}" download="${d.evidencia.name}" rel="noopener">Descargar</a>`
      : "—";
    const descripcionCorta = d.descripcion.length > 200 ? d.descripcion.slice(0, 200) + "…" : d.descripcion;
    html += `<tr>
      <td>${fecha}</td>
      <td>${d.tipo}</td>
      <td><pre style="white-space:pre-wrap;margin:0;">${escapeHtml(descripcionCorta)}</pre></td>
      <td>${evidenciaBtn}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  listaDenuncias.innerHTML = html;
}

function escapeHtml(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function exportDenuncias() {
  const list = loadDenuncias();
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "denuncias_export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function clearStorage() {
  if (!confirm("¿Borrar todas las denuncias? (solo prueba)")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderDenuncias();
  showMessage("Almacenamiento borrado.", "success");
}

if(form){
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const tipo = document.getElementById("tipo").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const evidenciaInput = document.getElementById("evidencia");
    const btnEnviar = document.getElementById("btnEnviar");

    if (!tipo) { showMessage("Selecciona el tipo de extorsión.", "error"); return; }
    if (!descripcion || descripcion.length < 8) { showMessage("Describe el incidente (mínimo 8 caracteres).", "error"); return; }

    const containsPotentialId = /\b\d{6,}\b/.test(descripcion);
    if (containsPotentialId) {
      if (!confirm("Parece que añadiste números largos. ¿Confirmas que no son datos personales y deseas continuar?")) {
        showMessage("Edita la descripción para eliminar datos personales.", "error");
        return;
      }
    }

    btnEnviar.disabled = true;
    showMessage("Registrando denuncia (simulado)...", "success");

    let evidenciaObj = null;
    const file = evidenciaInput.files[0];
    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        showMessage("La evidencia excede 2 MB.", "error");
        btnEnviar.disabled = false;
        return;
      }
      try {
        const data = await fileToDataURL(file);
        evidenciaObj = { name: file.name, data };
      } catch {
        showMessage("Error procesando la evidencia.", "error");
        btnEnviar.disabled = false;
        return;
      }
    }

    const nueva = {
      id: Date.now().toString(),
      tipo,
      descripcion,
      fecha: new Date().toISOString(),
      evidencia: evidenciaObj
    };

    const list = loadDenuncias();
    list.push(nueva);
    saveDenuncias(list);

    form.reset();
    renderDenuncias();
    showMessage("✅ Tu denuncia fue registrada (simulado).", "success");
    btnEnviar.disabled = false;
  });
}

if(btnExport) btnExport.addEventListener("click", exportDenuncias);
if(btnClear) btnClear.addEventListener("click", clearStorage);

document.addEventListener("DOMContentLoaded", () => {
  if(listaDenuncias) renderDenuncias();
});


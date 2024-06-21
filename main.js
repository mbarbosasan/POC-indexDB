import Dexie  from "dexie";
import * as ExcelJS from 'exceljs' 

let db = null;
window.addEventListener('load', () => {
  console.log('abrindo banco!');
  db = new Dexie('localFiles');
  db.version(1).stores({
    files: `
    id,
    name,
    blob`
  })

  buscarArquivos();

})

function escreverNoExcel(json) {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('My Sheet');
  const worksheet = workbook.getWorksheet('My Sheet');

  if (json.length > 0) {
    worksheet.columns = Object.keys(json[0]).map(key => ({
      header: key,
      key: key,
      width: 20
    }))
  }

  console.log(json)
  worksheet.addRows(json)
  return workbook.xlsx.writeBuffer().then((buffer) => {
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
  });
}

function realizarDownload(blob, nomeArquivo = 'planilha.xlsx') {
  const url = window.URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', nomeArquivo);
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  window.URL.revokeObjectURL(url);
}

function salvarArquivo(fileObj) {
  return db.files.put(fileObj)
}

export function handleSubmit(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (loadEvent) {
    try {
      const json = JSON.parse(loadEvent.target.result);
      console.log(json);
      escreverNoExcel(json).then((blob) => {
        salvarArquivo({id: Date.now() ,name: file.name, blob,}).then(() => buscarArquivos())
        realizarDownload(blob);
      })
    } catch (e) {
      console.error(e);
    }
  }

  reader.readAsText(file);
}

export function baixarArquivo(name) {
  console.log(name);
  db.files.get(name).then((file) => realizarDownload(file.blob))
}

export function buscarArquivos() {
  db.files.toArray().then((array) => {
    console.log(array);
    let lista = document.querySelector('ul');
    if (lista) document.removeChild('ul');
    lista = document.createElement('ul');
    const title = document.createElement('p')
    title.textContent = 'Histórico de arquivos:'
    lista.appendChild(title)
    document.body.appendChild(lista)
    array.forEach((li) => {
      const item = document.createElement('li');
      item.innerHTML = `
      <p>Seu arquivo <b>${li.name}</b> baixado ás ${new Date(li.id)},
        <a href="#" onclick="baixarArquivo(${li.id})">clique aqui para baixá-lo novamente.</a>
      </p>
      `
      lista.appendChild(item)
    })
  })
}


window.handleSubmit = handleSubmit;
window.buscarArquivos = buscarArquivos;
window.baixarArquivo = baixarArquivo;
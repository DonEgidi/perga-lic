function humanizeAssetName(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractDriveFileId(shareUrl) {
  const match = shareUrl.match(/\/d\/([^/]+)/)
  return match ? match[1] : ""
}

function toDrivePreviewUrl(shareUrl) {
  const fileId = extractDriveFileId(shareUrl)
  return `https://drive.google.com/file/d/${fileId}/preview`
}

function createCourseModule({ number, docxFile, audioFile, audioShareUrl, videoShareUrl }) {
  const folderPath = `/course/modulo ${number}`

  return {
    id: `modulo-${number}`,
    number,
    label: `Modulo ${number}`,
    title: humanizeAssetName(audioFile || docxFile),
    docxPath: `${folderPath}/${docxFile}`,
    videoPath: toDrivePreviewUrl(videoShareUrl),
    audioPath: toDrivePreviewUrl(audioShareUrl),
  }
}

export const courseModules = [
  createCourseModule({
    number: "00",
    docxFile: "Modulo 00.docx",
    audioFile: "capitulo 0.m4a",
    audioShareUrl: "https://drive.google.com/file/d/166wXn3OopAUeYk4ucNYru6YdtyXLqSa3/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1Zslbt0mlXcAWlE7Sd6tHBVa8GPl-qxDM/view?usp=sharing",
  }),
  createCourseModule({
    number: "01",
    docxFile: "Modulo 01.docx",
    audioFile: "La_calle_es_un_pacto_de_supervivencia.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1mWhO2Ucr-JDfNYy5UJuJ9S53JDxrGPy-/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1NxkGicZtt9_Fi06j0_gAndlf1hc0r5i_/view?usp=sharing",
  }),
  createCourseModule({
    number: "02",
    docxFile: "Modulo 02.docx",
    audioFile: "El_engranaje_legal_de_la_licencia_nacional.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1GL31ZHY27m_V3fEqLKgULjoeIC8y7XxC/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1tzjhW8v5FJLhLJVnP2Fd2MNy_mE7W9NC/view?usp=sharing",
  }),
  createCourseModule({
    number: "03",
    docxFile: "Modulo 03.docx",
    audioFile: "Tu_auto_es_una_armadura_tecnológica.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1O41dJwB38JIsF0wz1YM0wBXwXvAq4XQS/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1oRwIYLSwP0YLGKrL-Q7pV5EXcqGjYm90/view?usp=sharing",
  }),
  createCourseModule({
    number: "04",
    docxFile: "Modulo 04.docx",
    audioFile: "La_mecánica_oculta_del_ahorro_de_combustible.m4a",
    audioShareUrl: "https://drive.google.com/file/d/117jVPY0xAJjn2X_tbVtBC6s5_-FqpaDi/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1QTPtqHkDznSgf8N3MU8JSdirzV7MHicP/view?usp=sharing",
  }),
  createCourseModule({
    number: "05",
    docxFile: "Modulo 05.docx",
    audioFile: "La_psicología_y_física_al_volante.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1Suti4NFVY7kHRv7DhPYuhpvXfXQhI-qX/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1KFj5sYgEIRCGch2uR9OBPArDp5oPhuiM/view?usp=sharing",
  }),
  createCourseModule({
    number: "06",
    docxFile: "Modulo 06.docx",
    audioFile: "La_lógica_de_los_límites_de_velocidad.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1iNYGAOm_KHPWNLIH6NWV3LVsVq5ny1yu/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1JeoMZzxdshLCrmyQA0xodHkIvjytjo2Q/view?usp=sharing",
  }),
  createCourseModule({
    number: "07",
    docxFile: "Modulo 07.docx",
    audioFile: "Cómo_las_calles_controlan_tu_mente.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1PvUzXJungAm2eGVrOsjh7En8CqH_MISi/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1N6aQrgOhNVHSRok0e39GBjlMn8xA6ljP/view?usp=sharing",
  }),
  createCourseModule({
    number: "08",
    docxFile: "Modulo 08.docx",
    audioFile: "Tu_cerebro_es_el_peligro_al_volante.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1Rwr3p_K9BayJmuFF0SnOlmFQBo1JX_3N/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/11ZqU_A2VA03L_is6fpo5iRHaJc8UDPgm/view?usp=sharing",
  }),
  createCourseModule({
    number: "09",
    docxFile: "Modulo 09.docx",
    audioFile: "El_contrato_invisible_tras_el_volante.m4a",
    audioShareUrl: "https://drive.google.com/file/d/1BqjZ2nLmb54hR04WMq8pi_rdWvRPRva1/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/1dFK-5UqhJPckBad5v4NKVQyw0On9cR88/view?usp=sharing",
  }),
  createCourseModule({
    number: "10",
    docxFile: "Modulo 10.docx",
    audioFile: "Módulo_10_y_el_privilegio_de_conducir.m4a",
    audioShareUrl: "https://drive.google.com/file/d/17PUG4pCN4QBM2abUkk-SNIQusFZFbVG7/view?usp=sharing",
    videoShareUrl: "https://drive.google.com/file/d/12lHiqPViWfr7dgr6ZlGwe7jMGELxIY6G/view?usp=sharing",
  }),
]

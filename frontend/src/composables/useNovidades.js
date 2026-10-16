// Novidades (RF49): versões do CHANGELOG.md e o selo de "versão nova desde a última visita" (CT16, CT17).
import { computed, ref } from 'vue'
import { LocalStorage } from 'quasar'
import changelog from 'src/assets/changelog.json'

const CHAVE = 'suricate.novidades.vista'
const vista = ref(lerVista())

function lerVista() {
  try {
    return LocalStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

export function useNovidades(dados = changelog) {
  const versoes = computed(() => dados.versoes)
  const ultima = computed(() => dados.versoes[0]?.versao ?? null)
  const temNovidade = computed(() => ultima.value !== null && vista.value !== ultima.value)

  function marcarComoVista() {
    vista.value = ultima.value
    try {
      LocalStorage.set(CHAVE, ultima.value)
    } catch {
      // armazenamento bloqueado: o selo some só nesta sessão
    }
  }

  return { versoes, emPreparacao: computed(() => dados.emPreparacao), ultima, temNovidade, marcarComoVista }
}

<!-- Layout dos protótipos (M0): barra inferior no celular, barra lateral no desktop, seletor de período no topo -->
<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import SuriMascote from 'components/SuriMascote.vue'
import PeriodoSelector from 'components/PeriodoSelector.vue'
import { useNovidades } from 'src/composables/useNovidades'

const $q = useQuasar()
const route = useRoute()
const { temNovidade } = useNovidades()
const desktop = computed(() => $q.screen.gt.sm)
const mais = ref(false)

const principais = [
  { to: '/', label: 'Período', icon: 'sym_r_visibility' },
  { to: '/lancamentos', label: 'Lançamentos', icon: 'sym_r_receipt_long' },
  { to: '/cartoes', label: 'Cartões', icon: 'sym_r_credit_card' },
]
const secundarios = [
  { to: '/familia', label: 'Família', icon: 'sym_r_family_restroom' },
  { to: '/planejamento', label: 'Planejamento', icon: 'sym_r_target' },
  { to: '/contas', label: 'Contas', icon: 'sym_r_account_balance' },
  { to: '/categorias', label: 'Categorias', icon: 'sym_r_category' },
  { to: '/novidades', label: 'Novidades', icon: 'sym_r_campaign' },
  { to: '/status', label: 'Status do sistema', icon: 'sym_r_monitor_heart' },
  { to: '/configuracoes', label: 'Configurações', icon: 'sym_r_settings' },
]
const ativo = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
const noMais = computed(() => !principais.some((p) => ativo(p.to)))

function novoLancamento() {
  $q.notify({ message: 'Os lançamentos chegam no M4 · Contas e lançamentos.', color: 'secondary' })
}
</script>

<template>
  <q-layout view="hHh LpR fFf">
    <q-header bordered>
      <q-toolbar style="min-height: 64px; gap: 8px">
        <router-link
          v-if="desktop"
          to="/"
          class="row items-center no-wrap"
          style="width: 220px; gap: 8px; color: inherit; text-decoration: none"
        >
          <SuriMascote :tamanho="26" />
          <span class="sf-titulo" style="font-size: 18px">Suricate</span>
        </router-link>
        <q-space />
        <PeriodoSelector />
        <q-space />
        <template v-if="desktop">
          <q-btn
            color="primary"
            unelevated
            icon="sym_r_add"
            label="Novo lançamento"
            @click="novoLancamento"
          />
          <q-btn
            flat
            round
            :icon="$q.dark.isActive ? 'sym_r_light_mode' : 'sym_r_dark_mode'"
            :aria-label="$q.dark.isActive ? 'Usar tema claro' : 'Usar tema escuro'"
            @click="$q.dark.toggle()"
          />
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="desktop" :model-value="true" side="left" :width="240" bordered persistent>
      <q-list padding>
        <q-item
          v-for="n in [...principais, ...secundarios]"
          :key="n.to"
          :to="n.to"
          :active="ativo(n.to)"
          active-class="text-primary"
          style="border-radius: 8px; margin: 2px 8px"
        >
          <q-item-section avatar><q-icon :name="n.icon" /></q-item-section>
          <q-item-section>{{ n.label }}</q-item-section>
          <q-item-section v-if="n.to === '/novidades' && temNovidade" side>
            <q-badge color="primary" label="nova" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-footer v-if="!desktop" bordered>
      <nav class="row no-wrap items-stretch sf-nav" style="height: 64px" aria-label="Navegação principal">
        <q-btn
          v-for="n in principais.slice(0, 2)"
          :key="n.to"
          flat
          stack
          no-caps
          class="col"
          size="sm"
          :to="n.to"
          :color="ativo(n.to) ? 'primary' : undefined"
          :icon="n.icon"
          :label="n.label"
        />
        <div class="flex flex-center" style="width: 64px; flex: none">
          <q-btn
            round
            unelevated
            color="primary"
            icon="sym_r_add"
            size="lg"
            aria-label="Novo lançamento"
            @click="novoLancamento"
          />
        </div>
        <q-btn
          flat
          stack
          no-caps
          class="col"
          size="sm"
          to="/cartoes"
          :color="ativo('/cartoes') ? 'primary' : undefined"
          icon="sym_r_credit_card"
          label="Cartões"
        />
        <q-btn
          flat
          stack
          no-caps
          class="col"
          size="sm"
          :color="noMais ? 'primary' : undefined"
          icon="sym_r_menu"
          label="Mais"
          @click="mais = true"
        >
          <q-badge v-if="temNovidade" color="primary" floating rounded />
        </q-btn>
      </nav>
    </q-footer>

    <q-dialog v-model="mais" position="bottom">
      <q-card class="sf-card" style="width: 100%; border-radius: 18px 18px 0 0">
        <q-card-section class="sf-titulo" style="font-size: 20px">Mais</q-card-section>
        <q-list>
          <q-item v-for="n in secundarios" :key="n.to" v-close-popup clickable :to="n.to">
            <q-item-section avatar><q-icon :name="n.icon" color="primary" /></q-item-section>
            <q-item-section>{{ n.label }}</q-item-section>
            <q-item-section v-if="n.to === '/novidades' && temNovidade" side>
              <q-badge color="primary" label="nova" />
            </q-item-section>
          </q-item>
          <q-item clickable @click="$q.dark.toggle()">
            <q-item-section avatar>
              <q-icon :name="$q.dark.isActive ? 'sym_r_light_mode' : 'sym_r_dark_mode'" color="primary" />
            </q-item-section>
            <q-item-section>{{ $q.dark.isActive ? 'Usar tema claro' : 'Usar tema escuro' }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

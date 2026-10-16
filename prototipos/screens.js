/* Telas T01–T16 do protótipo. Depende do estado, dos dados e do app definidos em index.html. */

/* T01 · Boas-vindas e login (RF01, RF02) */
app.component('s-t01', {
  mixins: [modeProps],
  data: () => ({ email: 'phelipe@exemplo.com', senha: 'senha-exemplo' }),
  template: `<div class="auth-wrap" :style="{ height: desk ? '900px' : '760px', background: desk ? 'radial-gradient(circle at 20% 20%, rgba(168,90,42,.18), transparent 50%), radial-gradient(circle at 80% 80%, rgba(47,93,80,.18), transparent 50%)' : '' }">
    <q-card flat :class="desk ? 'q-pa-xl' : 'q-pa-none'" :style="desk ? '' : 'border:0;background:transparent'">
      <div class="auth-card">
        <div style="text-align:center">
          <span v-html="suriSvg('vigia', desk ? 96 : 84)"></span>
          <h1 style="font-size:28px;font-weight:800;margin:8px 0 4px">Suricate Finance</h1>
          <p class="text-muted" style="margin:0">Suas finanças no ritmo do seu salário.</p>
        </div>
        <q-btn outline color="primary" icon="sym_r_login" label="Entrar com Google" @click="go('T04')" />
        <div class="lbl" style="text-align:center">ou com e-mail</div>
        <q-input id="t01-email" outlined dense v-model="email" label="E-mail" type="email" />
        <q-input id="t01-senha" outlined dense v-model="senha" label="Senha" type="password" />
        <q-btn unelevated color="primary" label="Entrar" @click="go('T04')" />
        <q-btn flat color="primary" label="Ainda não tenho conta" @click="go('T02')" />
      </div>
    </q-card>
  </div>`,
});

/* T02 · Cadastro (RF01) */
app.component('s-t02', {
  mixins: [modeProps],
  data: () => ({ nome: 'Phelipe Afonso', email: 'phelipe@exemplo.com', senha: 'senha-exemplo', termos: true }),
  methods: { criar() { iniciarOnb(); go('T03'); } },
  template: `<div class="auth-wrap" :style="{ height: desk ? '900px' : '760px' }">
    <q-card flat :class="desk ? 'q-pa-xl' : 'q-pa-none'" :style="desk ? '' : 'border:0;background:transparent'">
      <div class="auth-card">
        <div class="row items-center no-wrap" style="gap:12px">
          <span v-html="suriSvg('feliz', 48)"></span>
          <div><h2 style="font-size:22px;font-weight:800;margin:0">Criar conta</h2><div class="lbl">Leva menos de um minuto. Depois, o Suri te ajuda a cadastrar tudo.</div></div>
        </div>
        <q-input id="t02-nome" outlined dense v-model="nome" label="Nome" />
        <q-input id="t02-email" outlined dense v-model="email" label="E-mail" type="email" />
        <q-input id="t02-senha" outlined dense v-model="senha" label="Senha" type="password" hint="Mínimo de 8 caracteres" />
        <q-checkbox id="t02-termos" v-model="termos" label="Li e aceito os termos de uso e a política de privacidade (LGPD)" />
        <q-btn unelevated color="primary" label="Criar conta" :disable="!termos" @click="criar" />
        <q-btn flat color="primary" label="Já tenho conta" @click="go('T01')" />
      </div>
    </q-card>
  </div>`,
});

/* T03 · Onboarding: cadastro guiado pelo Suri (RF03, RF04) */
app.component('s-t03', {
  mixins: [modeProps],
  computed: {
    o() { return S.onb; },
    fim() { return this.o.passo >= ETAPAS.length; },
    pessoais() { return this.o.contas.filter(c => c.tipo !== 'Familiar'); },
    saldoPessoal() { return this.pessoais.reduce((s, c) => s + (Number(c.saldo) || 0), 0); },
    renda() { return (Number(this.o.salario) || 0) + this.o.rendas.reduce((s, r) => s + (Number(r.valor) || 0), 0); },
    minhasFixas() {
      const o = this.o;
      return o.fixas.reduce((s, f) => s + (Number(f.valor) || 0) * (o.divide && f.dividir ? (100 - o.pct) / 100 : 1), 0);
    },
    limites() { return (Number(this.o.limCartao) || 0) + (Number(this.o.limDebito) || 0); },
    sobra() { return this.renda - this.minhasFixas - this.limites; },
    periodo() {
      const d = Math.min(28, Math.max(1, Number(this.o.dia) || 15));
      return { nome: 'Outubro', datas: d === 1 ? '01/10/2026 a 31/10/2026' : `${pad(d)}/10/2026 a ${pad(d - 1)}/11/2026` };
    },
    dicaCartao() {
      const c = this.o.cartoes[0]; if (!c || !c.fecha || !c.vence) return '';
      const f = Number(c.fecha), v = Number(c.vence), d = Number(this.o.dia) || 15, mes = v > f ? '11' : '12';
      return `Compras no ${c.nome} feitas a partir do dia ${f} vão para a fatura que vence em ${pad(v)}/${mes}, paga com o salário de ${pad(d)}/${mes}. Suricato não esquece!`;
    },
    sugestoes() { return FIXAS_SUGERIDAS.filter(n => !this.o.fixas.some(f => f.desc === n)); },
  },
  methods: {
    avancar() {
      const o = this.o, c = CONQUISTAS[o.passo];
      if (!o.conquistas.includes(c)) { o.conquistas.push(c); toast('Conquista desbloqueada: ' + c); }
      o.passo++;
      this.$nextTick(() => { const el = this.$refs.corpo; if (el) el.scrollTop = 0; });
    },
    voltar() { if (this.o.passo > 0) this.o.passo--; },
    pular() { this.o.passo++; },
    add(lista, novo, vazio) {
      const n = this.o[novo]; if (!n.nome && !n.desc) return;
      this.o[lista].push({ ...n }); this.o[novo] = { ...vazio };
    },
    fixa(nome) { this.o.fixas.push({ desc: nome, dia: 5, valor: null, naoAtrasar: false, dividir: this.o.divide }); },
    meta(m) { const i = this.o.metas.indexOf(m); i >= 0 ? this.o.metas.splice(i, 1) : this.o.metas.push(m); },
  },
  template: `<div :style="{ height: desk ? '900px' : '760px', display: 'grid', gridTemplateColumns: desk ? '250px minmax(0,1fr) 340px' : 'minmax(0,1fr)' }">
    <aside v-if="desk" class="q-pa-lg" style="border-right:1px solid var(--app-line);background:var(--app-surface);overflow-y:auto">
      <div class="row items-center no-wrap" style="gap:8px;margin-bottom:20px"><span v-html="suriSvg('vigia', 28)"></span><b class="font-display" style="font-size:18px">Suricate</b></div>
      <q-list>
        <q-item v-for="(e, i) in ETAPAS" :key="e" clickable :active="o.passo === i" active-class="text-primary" style="border-radius:8px" @click="o.passo = i">
          <q-item-section avatar style="min-width:36px">
            <q-icon v-if="o.conquistas.includes(CONQUISTAS[i])" name="sym_r_check_circle" color="positive" />
            <q-avatar v-else size="24px" :color="o.passo === i ? 'primary' : 'grey-4'" :text-color="o.passo === i ? 'white' : 'grey-8'" style="font-size:12px">{{ i + 1 }}</q-avatar>
          </q-item-section>
          <q-item-section>{{ e }}</q-item-section>
        </q-item>
      </q-list>
      <div class="lbl" style="margin-top:16px">Conquistas: {{ o.conquistas.length }} de {{ CONQUISTAS.length }}</div>
      <q-linear-progress :value="o.conquistas.length / CONQUISTAS.length" color="secondary" rounded size="8px" style="margin-top:6px" aria-label="Conquistas" />
    </aside>

    <div style="display:flex;flex-direction:column;min-height:0;height:100%">
      <div v-if="!desk" class="q-px-md q-pt-md q-pb-sm" style="border-bottom:1px solid var(--app-line);background:var(--app-surface)">
        <div class="row items-center no-wrap" style="gap:8px">
          <q-btn v-if="o.passo > 0 && !fim" flat round dense icon="sym_r_arrow_back" aria-label="Etapa anterior" @click="voltar" />
          <div class="col"><div class="lbl">{{ fim ? 'Tudo pronto' : 'Etapa ' + (o.passo + 1) + ' de ' + ETAPAS.length }}</div><b>{{ fim ? 'Seu primeiro período' : ETAPAS[o.passo] }}</b></div>
          <q-btn v-if="!fim" flat dense no-caps color="primary" label="Pular" @click="go('T04')" />
        </div>
        <q-linear-progress :value="Math.min(1, o.passo / ETAPAS.length)" color="primary" rounded size="6px" style="margin-top:8px" aria-label="Progresso do cadastro" />
      </div>

      <div ref="corpo" style="flex:1;overflow-y:auto;overflow-x:hidden" :class="desk ? 'q-pa-xl' : 'q-pa-md'">
        <div class="stack" :style="{ maxWidth: desk ? '640px' : 'none', margin: '0 auto', gap: '16px' }">
          <h2 v-if="desk && !fim" class="sec-title" style="font-size:24px">{{ ETAPAS[o.passo] }}</h2>

          <template v-if="o.passo === 0">
            <div class="suri-tip"><span v-html="suriSvg('feliz', 52)"></span><p><b>Oi! Eu sou o Suri.</b> Vou ficar de vigia nas suas finanças. Em 7 etapas a gente monta o seu primeiro período, e você já sai com tudo cadastrado.</p></div>
            <q-input id="t03-nome" outlined v-model="o.nome" label="Como posso te chamar?" />
            <div class="lbl">O que você mais quer agora?</div>
            <div class="row" style="gap:4px">
              <q-chip v-for="op in ['Sair do vermelho','Juntar dinheiro','Quitar dívida','Organizar as contas','Outros']" :key="op" clickable
                :color="o.objetivo === op ? 'primary' : undefined" :text-color="o.objetivo === op ? 'white' : undefined" @click="o.objetivo = op">{{ op }}</q-chip>
            </div>
            <q-input v-if="o.objetivo === 'Outros'" id="t03-obj-outro" outlined dense v-model="o.objetivoOutro" label="Conte com suas palavras" />
          </template>

          <template v-else-if="o.passo === 1">
            <div class="suri-tip"><span v-html="suriSvg('vigia', 48)"></span><p>Seu período começa quando o salário entra, e não no dia 1. Com o dia {{ o.dia }}, o primeiro será <b>{{ periodo.nome }} · {{ periodo.datas }}</b>.</p></div>
            <div class="row q-col-gutter-sm">
              <div class="col-4"><q-input id="t03-dia" outlined v-model.number="o.dia" type="number" min="1" max="28" label="Dia do salário" /></div>
              <div class="col-8"><q-input id="t03-sal" outlined v-model.number="o.salario" type="number" label="Valor médio" prefix="R$" input-class="tnum" /></div>
            </div>
            <div class="lbl">Quando o dia {{ o.dia }} cai no fim de semana ou feriado</div>
            <div class="row" style="gap:4px">
              <q-chip v-for="op in [['antecipa','Antecipa'],['adia','Adia'],['nao-muda','Não muda'],['nao-sei','Não sei']]" :key="op[0]" clickable
                :color="o.fds === op[0] ? 'primary' : undefined" :text-color="o.fds === op[0] ? 'white' : undefined" @click="o.fds = op[0]">{{ op[1] }}</q-chip>
            </div>
            <q-toggle id="t03-atrasa" v-model="o.atrasa" label="O salário costuma atrasar" />
            <q-input v-if="o.atrasa" id="t03-dias" outlined dense v-model.number="o.diasAtraso" type="number" min="1" label="Quantos dias, no máximo?" style="max-width:220px" />
            <div class="sec-title" style="font-size:16px">Outras entradas fixas</div>
            <div v-for="(r, i) in o.rendas" :key="i" class="onb-item">
              <q-icon name="sym_r_south_west" color="positive" />
              <div class="grow"><div>{{ r.desc }}</div><div class="lbl">todo dia {{ r.dia }}</div></div>
              <b class="tnum">{{ brl(Number(r.valor) || 0) }}</b>
              <q-btn flat round dense icon="sym_r_delete" aria-label="Remover" @click="o.rendas.splice(i, 1)" />
            </div>
            <div class="onb-add">
              <div class="row q-col-gutter-sm">
                <div :class="desk ? 'col-6' : 'col-12'"><q-input id="t03-r-desc" outlined dense v-model="o.novaRenda.desc" label="Descrição" placeholder="Ex.: Freela" /></div>
                <div :class="desk ? 'col-2' : 'col-4'"><q-input id="t03-r-dia" outlined dense v-model.number="o.novaRenda.dia" type="number" label="Dia" /></div>
                <div :class="desk ? 'col-4' : 'col-8'"><q-input id="t03-r-val" outlined dense v-model.number="o.novaRenda.valor" type="number" label="Valor" prefix="R$" /></div>
              </div>
              <q-btn flat color="primary" icon="sym_r_add" no-caps label="Adicionar entrada" style="justify-self:start" @click="add('rendas', 'novaRenda', { desc: '', dia: null, valor: null })" />
            </div>
          </template>

          <template v-else-if="o.passo === 2">
            <div class="suri-tip"><span v-html="suriSvg('vigia', 48)"></span><p>Cadastre onde seu dinheiro está hoje. A <b>conta familiar</b> guarda o dinheiro da casa, então ela não entra no seu disponível.</p></div>
            <div v-for="(c, i) in o.contas" :key="i" class="onb-item">
              <q-avatar size="34px" :color="c.tipo === 'Familiar' ? 'secondary' : 'primary'" text-color="white" icon="sym_r_account_balance" />
              <div class="grow"><div>{{ c.nome }}</div><div class="lbl">{{ c.banco }} · {{ c.tipo }}</div></div>
              <b class="tnum">{{ brl(Number(c.saldo) || 0) }}</b>
              <q-btn flat round dense icon="sym_r_delete" aria-label="Remover" @click="o.contas.splice(i, 1)" />
            </div>
            <div class="onb-add">
              <div class="row q-col-gutter-sm">
                <div class="col-7"><q-input id="t03-c-nome" outlined dense v-model="o.novaConta.nome" label="Nome da conta" placeholder="Ex.: Conta Familiar" /></div>
                <div class="col-5"><q-input id="t03-c-saldo" outlined dense v-model.number="o.novaConta.saldo" type="number" label="Saldo hoje" prefix="R$" /></div>
              </div>
              <div class="row" style="gap:4px">
                <q-chip v-for="b in ['Nubank','Inter','Itaú','Caixa','Outro']" :key="b" dense clickable :color="o.novaConta.banco === b ? 'primary' : undefined" :text-color="o.novaConta.banco === b ? 'white' : undefined" @click="o.novaConta.banco = b">{{ b }}</q-chip>
              </div>
              <div class="row" style="gap:4px">
                <q-chip v-for="t in ['Conta corrente','Poupança','Investimentos','VR/VA','Familiar']" :key="t" dense clickable :color="o.novaConta.tipo === t ? 'secondary' : undefined" :text-color="o.novaConta.tipo === t ? 'white' : undefined" @click="o.novaConta.tipo = t">{{ t }}</q-chip>
              </div>
              <q-btn flat color="primary" icon="sym_r_add" no-caps label="Adicionar conta" style="justify-self:start" @click="add('contas', 'novaConta', { nome: '', banco: 'Nubank', tipo: 'Conta corrente', saldo: null })" />
            </div>
          </template>

          <template v-else-if="o.passo === 3">
            <div class="suri-tip"><span v-html="suriSvg('vigia', 48)"></span><p>{{ dicaCartao || 'Cadastre seus cartões com o dia em que a fatura fecha e o dia em que vence.' }}</p></div>
            <div v-for="(c, i) in o.cartoes" :key="i" class="onb-item">
              <q-avatar size="34px" color="primary" text-color="white" icon="sym_r_credit_card" />
              <div class="grow"><div>{{ c.nome }}</div><div class="lbl">fecha dia {{ c.fecha }} · vence dia {{ c.vence }}</div></div>
              <span class="lbl tnum">limite {{ brl(Number(c.limite) || 0) }}</span>
              <q-btn flat round dense icon="sym_r_delete" aria-label="Remover" @click="o.cartoes.splice(i, 1)" />
            </div>
            <div class="onb-add">
              <div class="row q-col-gutter-sm">
                <div :class="desk ? 'col-6' : 'col-12'"><q-input id="t03-k-nome" outlined dense v-model="o.novoCartao.nome" label="Cartão" placeholder="Ex.: Leroy Pay" /></div>
                <div :class="desk ? 'col-6' : 'col-12'"><q-input id="t03-k-lim" outlined dense v-model.number="o.novoCartao.limite" type="number" label="Limite" prefix="R$" /></div>
                <div class="col-6"><q-input id="t03-k-fecha" outlined dense v-model.number="o.novoCartao.fecha" type="number" label="Fecha dia" /></div>
                <div class="col-6"><q-input id="t03-k-vence" outlined dense v-model.number="o.novoCartao.vence" type="number" label="Vence dia" /></div>
              </div>
              <q-btn flat color="primary" icon="sym_r_add" no-caps label="Adicionar cartão" style="justify-self:start" @click="add('cartoes', 'novoCartao', { nome: '', fecha: null, vence: null, limite: null })" />
            </div>
          </template>

          <template v-else-if="o.passo === 4">
            <div class="suri-tip"><span v-html="suriSvg('vigia', 48)"></span><p>Toque nas contas que você paga todo mês e preencha valor e vencimento. Marque as que <b>perdem desconto se atrasarem</b>: eu aviso antes.</p></div>
            <div class="row" style="gap:4px">
              <q-chip v-for="n in sugestoes" :key="n" clickable icon="sym_r_add" outline color="primary" @click="fixa(n)">{{ n }}</q-chip>
            </div>
            <div v-for="(f, i) in o.fixas" :key="i" class="onb-item" style="flex-wrap:wrap">
              <div class="grow" style="min-width:120px"><b>{{ f.desc }}</b></div>
              <q-input :id="'t03-f-val' + i" outlined dense v-model.number="f.valor" type="number" label="Valor" prefix="R$" style="width:140px" />
              <q-input :id="'t03-f-dia' + i" outlined dense v-model.number="f.dia" type="number" label="Dia" style="width:70px" />
              <q-checkbox :id="'t03-f-at' + i" v-model="f.naoAtrasar" dense label="Não pode atrasar" />
              <q-btn flat round dense icon="sym_r_delete" aria-label="Remover" @click="o.fixas.splice(i, 1)" />
            </div>
          </template>

          <template v-else-if="o.passo === 5">
            <div class="suri-tip"><span v-html="suriSvg('feliz', 48)"></span><p>Se você divide as contas da casa, o que você <b>transferir para a conta familiar já sai do seu disponível</b> na hora, mesmo antes de o boleto ser pago.</p></div>
            <q-toggle id="t03-divide" v-model="o.divide" label="Divido contas com alguém" />
            <template v-if="o.divide">
              <div class="row q-col-gutter-sm">
                <div class="col-7"><q-input id="t03-parc" outlined dense v-model="o.parceiro" label="Com quem" /></div>
                <div class="col-5"><q-input id="t03-pct" outlined dense v-model.number="o.pct" type="number" min="0" max="100" :label="'Parte de ' + (o.parceiro || 'outra pessoa') + ' (%)'" /></div>
              </div>
              <div class="lbl">Conta familiar</div>
              <div class="row" style="gap:4px">
                <q-chip v-for="c in o.contas.map(x => x.nome).concat(['Ainda não tenho'])" :key="c" dense clickable :color="o.contaFam === c ? 'secondary' : undefined" :text-color="o.contaFam === c ? 'white' : undefined" @click="o.contaFam = c">{{ c }}</q-chip>
              </div>
              <div class="lbl">Cartão do casal</div>
              <div class="row" style="gap:4px">
                <q-chip v-for="c in o.cartoes.map(x => x.nome).concat(['Não temos'])" :key="c" dense clickable :color="o.cartaoFam === c ? 'secondary' : undefined" :text-color="o.cartaoFam === c ? 'white' : undefined" @click="o.cartaoFam = c">{{ c }}</q-chip>
              </div>
              <div class="lbl">Contas fixas divididas</div>
              <div class="stack" style="gap:4px">
                <q-checkbox v-for="(f, i) in o.fixas" :key="i" :id="'t03-div' + i" v-model="f.dividir" dense :label="f.desc + (f.valor ? ' · sua parte ' + brl(f.valor * (100 - o.pct) / 100) : '')" />
              </div>
            </template>
          </template>

          <template v-else-if="o.passo === 6">
            <div class="suri-tip"><span v-html="suriSvg('vigia', 48)"></span><p>Escolha suas metas <b>na ordem de prioridade</b>. Quitar uma dívida com juros altos costuma render mais do que guardar, e eu vou te lembrar disso.</p></div>
            <div class="row" style="gap:4px">
              <q-chip v-for="m in ['Reserva de segurança','Quitar o carro','Reserva de emergência','Viagem','Aposentadoria']" :key="m" clickable
                :color="o.metas.includes(m) ? 'primary' : undefined" :text-color="o.metas.includes(m) ? 'white' : undefined" @click="meta(m)">
                <span v-if="o.metas.includes(m)" class="tnum" style="margin-right:4px">{{ o.metas.indexOf(m) + 1 }}.</span>{{ m }}
              </q-chip>
            </div>
            <div class="sec-title" style="font-size:16px">Quanto quer gastar por período</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6"><q-input id="t03-lcar" outlined v-model.number="o.limCartao" type="number" label="Cartão" prefix="R$" /></div>
              <div class="col-6"><q-input id="t03-ldeb" outlined v-model.number="o.limDebito" type="number" label="Débito e Pix" prefix="R$" /></div>
            </div>
            <div v-if="!desk" class="suri-tip"><p>Com o que você cadastrou, sobram cerca de <b class="tnum">{{ brl(sobra) }}</b> por período para as metas.</p></div>
          </template>

          <template v-else>
            <div style="text-align:center"><span v-html="suriSvg('comemorando', 90)"></span>
              <h2 class="sec-title" style="font-size:24px;margin-top:8px">Tudo pronto, {{ o.nome }}!</h2>
              <p class="text-muted" style="margin:4px 0 0">Seu primeiro período é <b>{{ periodo.nome }} · {{ periodo.datas }}</b>.</p></div>
            <div class="grid-2">
              <q-card><q-card-section><div class="lbl">Contas</div><b>{{ o.contas.length }}</b></q-card-section></q-card>
              <q-card><q-card-section><div class="lbl">Cartões</div><b>{{ o.cartoes.length }}</b></q-card-section></q-card>
              <q-card><q-card-section><div class="lbl">Contas fixas</div><b>{{ o.fixas.length }}</b></q-card-section></q-card>
              <q-card><q-card-section><div class="lbl">Sobra estimada por período</div><b class="tnum">{{ brl(sobra) }}</b></q-card-section></q-card>
            </div>
            <q-btn unelevated color="primary" size="lg" icon-right="sym_r_arrow_forward" label="Ver meu período" @click="go('T04')" />
          </template>
        </div>
      </div>

      <div v-if="!fim" class="onb-bar">
        <q-btn v-if="desk && o.passo > 0" flat color="primary" icon="sym_r_arrow_back" label="Voltar" @click="voltar" />
        <q-btn flat color="primary" no-caps label="Pular etapa" @click="pular" />
        <q-space />
        <q-btn unelevated color="primary" :label="o.passo === ETAPAS.length - 1 ? 'Concluir' : 'Continuar'" icon-right="sym_r_arrow_forward" @click="avancar" />
      </div>
    </div>

    <aside v-if="desk" class="q-pa-lg" style="border-left:1px solid var(--app-line);background:var(--app-surface);overflow-y:auto">
      <div class="sec-title" style="font-size:18px">Seu período tomando forma</div>
      <div class="lbl" style="margin-bottom:12px">Atualiza enquanto você cadastra.</div>
      <q-card flat class="q-mb-md"><q-card-section class="stack" style="gap:4px">
        <div class="font-display" style="font-weight:800;font-size:16px">{{ periodo.nome }}</div>
        <div class="lbl tnum">{{ periodo.datas }}</div>
      </q-card-section></q-card>
      <div class="stack" style="gap:8px">
        <div class="row-money"><span class="text-muted">Entradas por período</span><span class="amount-in">{{ brl(renda) }}</span></div>
        <div class="row-money"><span class="text-muted">Sua parte das contas fixas</span><span>− {{ brl(minhasFixas) }}</span></div>
        <div class="row-money"><span class="text-muted">Limites de cartão e débito/Pix</span><span>− {{ brl(limites) }}</span></div>
        <q-separator />
        <div class="row-money"><b>Sobra estimada por período</b><b :class="sobra >= 0 ? 'amount-in' : 'text-negative'">{{ brl(sobra) }}</b></div>
        <div class="lbl">Vai para as metas: {{ o.metas.join(', ') || 'nenhuma escolhida ainda' }}.</div>
        <q-separator />
        <div class="row-money"><span class="text-muted">Saldo nas suas contas hoje</span><span>{{ brl(saldoPessoal) }}</span></div>
        <div class="row-money"><span class="text-muted">Cartões</span><span>{{ o.cartoes.map(c => c.nome).join(', ') || '—' }}</span></div>
        <div v-if="o.divide" class="row-money"><span class="text-muted">Dividindo com</span><span>{{ o.parceiro }} ({{ o.pct }}%)</span></div>
      </div>
      <div class="sec-title" style="font-size:16px;margin-top:20px">Conquistas</div>
      <div class="row" style="gap:4px;margin-top:8px">
        <q-chip v-for="c in CONQUISTAS" :key="c" dense :icon="o.conquistas.includes(c) ? 'sym_r_emoji_events' : 'sym_r_lock'"
          :color="o.conquistas.includes(c) ? 'secondary' : undefined" :text-color="o.conquistas.includes(c) ? 'white' : undefined">{{ c }}</q-chip>
      </div>
    </aside>
  </div>`,
});

/* T04 · Painel do período (RF23, RF31, RF32, RF07) */
app.component('s-t04', {
  mixins: [modeProps],
  computed: {
    atual() { return S.periodo === 1; },
    contas() {
      return [
        { data: '21/10', desc: 'Fatura Leroy Pay', valor: 102.49, de: 'Pessoal', tx: 7 },
        { data: '22/10', desc: 'Aluguel Spazio Uno', valor: 2539.28, de: 'Família', late: true },
        { data: '24/10', desc: 'Fatura Nubank', valor: 1081.51, de: 'Pessoal', tx: 12 },
        { data: '05/11', desc: 'Celular', valor: 100, de: 'Pessoal', tx: 13 },
        { data: '14/11', desc: 'Condomínios e taxa extra', valor: 892.29, de: 'Família', late: true },
      ];
    },
    casaPagas() { return S.casa.filter(c => c.pago).length; },
    gridStyle() { return this.desk ? { gridTemplateAreas: '"disp cartao tip" "deb fam tip"' } : {}; },
  },
  methods: { abrir(c) { if (c.tx) { S.txSel = c.tx; go('T15'); } else { S.famTab = 'contas'; go('T12'); } } },
  template: `<div>
    <div v-if="!atual" class="stack" :style="{ maxWidth: desk ? '720px' : 'none' }">
      <div class="suri-tip">
        <span v-html="suriSvg(S.periodo === 0 ? 'comemorando' : 'vigia', 56)"></span>
        <p v-if="S.periodo === 0"><b>Setembro fechou no azul!</b><br>Entraram R$ 8.310,00 e saíram R$ 7.998,00. Sobraram R$ 312,00, que foram para a reserva de segurança.</p>
        <p v-else><b>Novembro começa em 15/11.</b><br>Já estão previstos R$ 1.060,00 da fatura do Nubank de 24/11 e R$ 2.576,26 da sua parte das contas da casa.</p>
      </div>
      <div class="lbl">No protótipo, os detalhes estão preenchidos só para o período Outubro.</div>
    </div>
    <div v-else :class="desk ? 'grid-3' : 'stack'" :style="gridStyle">
      <div class="stack" :style="desk ? 'grid-area:tip' : ''">
        <div class="suri-tip">
          <span v-html="suriSvg('feliz', 52)"></span>
          <p><b>Tudo sob vigia.</b> Ainda dá para gastar <b class="tnum">R$ 580,00</b> no cartão e <b class="tnum">R$ 166,00</b> da conta até 14/11. Mantendo o ritmo, o período fecha no azul.</p>
        </div>
        <q-card v-if="desk">
          <q-card-section>
            <div class="sec-title" style="font-size:16px">Próximas contas</div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="c in contas" :key="c.desc" clickable @click="abrir(c)">
              <q-item-section avatar class="tnum text-muted" style="min-width:44px">{{ c.data }}</q-item-section>
              <q-item-section><q-item-label>{{ c.desc }}</q-item-label><q-item-label caption>{{ c.de }}<q-badge v-if="c.late" color="warning" class="badge-late q-ml-xs" label="não pode atrasar" /></q-item-label></q-item-section>
              <q-item-section side class="tnum">{{ brl(c.valor) }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      <q-card :style="desk ? 'grid-area:disp' : ''">
        <q-card-section class="stack">
          <div class="lbl">Disponível no período Outubro</div>
          <div class="big-num">R$ 166,00</div>
          <div class="stack" style="gap:6px">
            <div class="row-money"><span class="text-muted">Saldo nas suas contas</span><span>{{ brl(1240) }}</span></div>
            <div class="row-money"><span class="text-muted">A receber até 14/11</span><span class="amount-in">+ {{ brl(810) }}</span></div>
            <div class="row-money"><span class="text-muted">Contas e faturas a pagar</span><span>− {{ brl(1284) }}</span></div>
            <div class="row-money"><span class="text-muted">Reservado para as metas</span><span>− {{ brl(600) }}</span></div>
          </div>
        </q-card-section>
      </q-card>
      <q-card :style="desk ? 'grid-area:cartao' : ''">
        <q-card-section class="stack">
          <div class="row items-center"><q-icon name="sym_r_credit_card" size="20px" class="q-mr-sm" /><b>Cartão neste período</b><q-space /><q-btn flat dense no-caps color="primary" label="Ver fatura" @click="S.cardSel = 'nubank'; go('T08')" /></div>
          <limite label="Compras desde 15/10" :usado="420" :total="1000" />
          <q-separator />
          <div class="row-money"><span class="text-muted">Fatura de 24/11, paga em Novembro</span><b>{{ brl(1060) }}</b></div>
          <div class="row-money"><span class="text-muted">Fatura ideal para bater as metas</span><span>até {{ brl(1640) }}</span></div>
        </q-card-section>
      </q-card>
      <q-card :style="desk ? 'grid-area:deb' : ''">
        <q-card-section><limite label="Débito e Pix" :usado="134" :total="300" /></q-card-section>
      </q-card>
      <q-card v-if="!desk">
        <q-card-section style="padding-bottom:0"><b>Próximas contas</b></q-card-section>
        <q-list separator>
          <q-item v-for="c in contas" :key="c.desc" clickable @click="abrir(c)">
            <q-item-section avatar class="tnum text-muted" style="min-width:44px">{{ c.data }}</q-item-section>
            <q-item-section><q-item-label>{{ c.desc }}</q-item-label><q-item-label caption>{{ c.de }}<q-badge v-if="c.late" color="warning" class="badge-late q-ml-xs" label="não pode atrasar" /></q-item-label></q-item-section>
            <q-item-section side class="tnum">{{ brl(c.valor) }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
      <q-card :style="desk ? 'grid-area:fam' : ''">
        <q-card-section class="stack">
          <div class="row items-center"><q-icon name="sym_r_family_restroom" size="20px" class="q-mr-sm" /><b>Família</b><q-space /><q-btn flat dense no-caps color="primary" label="Abrir" @click="go('T12')" /></div>
          <div class="row-money"><span class="text-muted">Sua parte, transferida em 16/10</span><span>{{ brl(2576.26) }}</span></div>
          <div class="row-money"><span class="text-muted">Agatha</span><q-badge :color="S.repasseAgatha ? 'positive' : 'warning'" :label="S.repasseAgatha ? 'repassado' : 'a receber ' + brl(2576.26)" /></div>
          <div class="row-money"><span class="text-muted">Contas da casa pagas</span><span>{{ casaPagas }} de {{ S.casa.length }}</span></div>
        </q-card-section>
      </q-card>
    </div>
  </div>`,
});

/* T05 · Lançamentos do período (RF09, RF07) */
app.component('s-t05', {
  mixins: [modeProps],
  computed: {
    itens() {
      const f = S.filtro;
      return LANC.filter(l => f === 'todos' || (f === 'despesas' && (l.tipo === 'despesa' || l.tipo === 'cartao')) || (f === 'receitas' && l.tipo === 'receita') || (f === 'cartao' && l.tipo === 'cartao') || (f === 'pendentes' && !l.pago));
    },
    dias() { const g = {}; this.itens.forEach(l => { (g[l.data] = g[l.data] || []).push(l); }); return Object.entries(g); },
    entradas() { return LANC.filter(l => l.valor > 0).reduce((s, l) => s + l.valor, 0); },
    saidas() { return LANC.filter(l => l.valor < 0).reduce((s, l) => s - l.valor, 0); },
  },
  methods: { abrir(l) { S.txSel = l.id; go('T15'); }, icone(l) { return { receita: 'sym_r_south_west', cartao: 'sym_r_credit_card', transf: 'sym_r_swap_horiz' }[l.tipo] || 'sym_r_north_east'; } },
  template: `<div class="stack">
    <div class="row items-center" style="gap:8px">
      <h2 class="sec-title">Lançamentos</h2><q-space />
      <q-btn v-if="desk" outline color="primary" icon="sym_r_add" label="Novo" @click="openSheet('T06')" />
    </div>
    <div :class="desk ? 'grid-3' : 'row'" :style="desk ? '' : 'gap:8px'">
      <q-card :class="desk ? '' : 'col'"><q-card-section><div class="lbl">Entradas</div><b class="tnum amount-in">{{ brl(entradas) }}</b></q-card-section></q-card>
      <q-card :class="desk ? '' : 'col'"><q-card-section><div class="lbl">Saídas</div><b class="tnum">{{ brl(saidas) }}</b></q-card-section></q-card>
      <q-card v-if="desk"><q-card-section><div class="lbl">Resultado do período</div><b class="tnum" :class="entradas - saidas >= 0 ? 'amount-in' : 'text-negative'">{{ brl(entradas - saidas) }}</b></q-card-section></q-card>
    </div>
    <div class="row" style="gap:4px">
      <q-chip v-for="f in [['todos','Todos'],['despesas','Despesas'],['receitas','Receitas'],['cartao','Cartão'],['pendentes','Pendentes']]" :key="f[0]" clickable
        :color="S.filtro === f[0] ? 'primary' : undefined" :text-color="S.filtro === f[0] ? 'white' : undefined" @click="S.filtro = f[0]">{{ f[1] }}</q-chip>
    </div>
    <q-card v-if="desk">
      <table class="tbl">
        <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta ou cartão</th><th>Situação</th><th class="r">Valor</th></tr></thead>
        <tbody>
          <tr v-for="l in itens" :key="l.id" class="click" @click="abrir(l)">
            <td class="text-muted">{{ l.data }}</td><td>{{ l.desc }}</td><td>{{ l.cat }}</td><td>{{ l.conta }}</td>
            <td><q-badge :color="l.pago ? 'positive' : 'warning'" :label="l.pago ? (l.valor > 0 ? 'recebido' : 'pago') : 'pendente'" /></td>
            <td class="r" :class="l.valor > 0 ? 'amount-in' : ''">{{ brl(l.valor) }}</td>
          </tr>
        </tbody>
      </table>
    </q-card>
    <div v-else>
      <template v-for="[d, ls] in dias" :key="d">
        <div class="day-head tnum">{{ d }}</div>
        <q-card>
          <q-list separator>
            <q-item v-for="l in ls" :key="l.id" clickable @click="abrir(l)">
              <q-item-section avatar><q-avatar size="34px" :color="l.valor > 0 ? 'positive' : 'grey-5'" text-color="white" :icon="icone(l)" /></q-item-section>
              <q-item-section><q-item-label>{{ l.desc }}</q-item-label><q-item-label caption>{{ l.cat }} · {{ l.conta }}<span v-if="!l.pago"> · pendente</span></q-item-label></q-item-section>
              <q-item-section side class="tnum" :class="l.valor > 0 ? 'amount-in' : ''">{{ brl(l.valor) }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>
    </div>
  </div>`,
});

/* T06 · Novo lançamento (RF09, RF10, RF11, RF14, RF16, RF36) */
app.component('s-t06', {
  mixins: [modeProps],
  computed: {
    n() { return S.novo; },
    info() { return this.n.tipo === 'cartao' ? infoCartao(this.n) : null; },
    cartao() { return CARTOES.find(c => c.id === this.n.origem); },
  },
  methods: {
    salvar() { S.sheet = null; toast('Lançamento salvo. No protótipo, nada é gravado.'); },
    dataBr(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; },
  },
  template: `<div class="stack">
    <h3>Novo lançamento</h3>
    <q-tabs v-model="n.tipo" dense align="justify" active-color="primary" indicator-color="primary" no-caps>
      <q-tab name="despesa" label="Despesa" /><q-tab name="receita" label="Receita" /><q-tab name="cartao" label="Cartão" /><q-tab name="transf" label="Transferência" />
    </q-tabs>
    <q-input id="t06-valor" outlined v-model="n.valor" label="Valor" prefix="R$" input-class="tnum" input-style="font-size:22px;font-weight:700" />
    <div class="row q-col-gutter-sm">
      <div class="col-6"><q-input id="t06-data" outlined dense v-model="n.data" type="date" :label="n.tipo === 'cartao' ? 'Data da compra' : 'Data'" stack-label /></div>
      <div class="col-6"><q-input id="t06-desc" outlined dense v-model="n.desc" label="Descrição" /></div>
    </div>
    <template v-if="n.tipo !== 'transf'">
      <div class="lbl">Categoria</div>
      <div class="row" style="gap:4px">
        <q-chip v-for="c in ['Restaurante','Lanches','Supermercado','Pet','Saúde','Lazer','Outros']" :key="c" clickable dense
          :color="n.cat === c ? 'primary' : undefined" :text-color="n.cat === c ? 'white' : undefined" @click="n.cat = c">{{ c }}</q-chip>
      </div>
    </template>
    <template v-if="n.tipo === 'cartao'">
      <div class="lbl">Cartão</div>
      <q-btn-toggle v-model="n.origem" no-caps unelevated toggle-color="primary" :options="CARTOES.map(c => ({ label: c.nome, value: c.id }))" />
      <q-input id="t06-parcelas" outlined dense v-model.number="n.parcelas" type="number" min="1" max="24" label="Parcelas" style="max-width:140px" />
      <div v-if="info" class="suri-tip">
        <span v-html="suriSvg(info.atual ? 'preocupado' : 'vigia', 40)"></span>
        <p>Compra de {{ dataBr(n.data) }} no {{ cartao.nome }}: conta no limite de gasto do período <b>{{ info.periodoGasto }}</b>.
          {{ info.n > 1 ? 'A 1ª parcela vai' : 'Vai' }} na fatura de <b class="tnum">{{ info.fatura }}</b>, paga no período <b>{{ info.periodoPaga }}</b><span v-if="info.ultima">; a última parcela, na fatura de <span class="tnum">{{ info.ultima }}</span></span>.
          <br v-if="info.atual"><b v-if="info.atual">Atenção: a compra é de antes do fechamento (dia {{ cartao.fecha }}), então entra na fatura que você paga ainda neste período.</b></p>
      </div>
    </template>
    <template v-else-if="n.tipo === 'transf'">
      <div class="row q-col-gutter-sm">
        <div class="col-6"><div class="lbl">De</div><q-btn-toggle model-value="pessoal" no-caps unelevated toggle-color="primary" :options="[{ label: 'Conta Pessoal', value: 'pessoal' }]" /></div>
        <div class="col-6"><div class="lbl">Para</div><q-btn-toggle model-value="familia" no-caps unelevated toggle-color="secondary" :options="[{ label: 'Conta Familiar', value: 'familia' }]" /></div>
      </div>
      <div class="suri-tip"><span v-html="suriSvg('vigia', 40)"></span><p>Transferência para a conta familiar: o valor vira <b>comprometido</b> e sai do seu disponível na hora, mesmo que os boletos ainda não tenham sido pagos.</p></div>
    </template>
    <template v-else>
      <div class="lbl">Conta</div>
      <q-btn-toggle model-value="Conta Pessoal" no-caps unelevated toggle-color="primary" :options="[{ label: 'Conta Pessoal', value: 'Conta Pessoal' }, { label: 'Conta Familiar', value: 'Conta Familiar' }]" />
      <q-toggle id="t06-pago" v-model="n.pago" :label="n.tipo === 'receita' ? 'Já recebi' : 'Já paguei'" />
      <q-toggle v-if="n.tipo === 'despesa'" id="t06-atrasar" v-model="n.naoAtrasar" label="Não pode atrasar (perde desconto)" />
    </template>
    <q-toggle v-if="n.tipo === 'despesa' || n.tipo === 'cartao'" id="t06-familia" v-model="n.familia" label="Dividir com a família (50% Agatha)" />
    <div class="row justify-end" style="gap:8px">
      <q-btn flat color="primary" label="Cancelar" @click="S.sheet = null" />
      <q-btn unelevated color="primary" label="Salvar" @click="salvar" />
    </div>
  </div>`,
});

/* T07 · Cartões (RF13, RF15) */
app.component('s-t07', {
  mixins: [modeProps],
  methods: { ver(c) { S.cardSel = c.id; go('T08'); } },
  template: `<div class="stack">
    <div class="row items-center" style="gap:8px">
      <h2 class="sec-title">Cartões</h2><q-space />
      <q-btn outline color="primary" icon="sym_r_add" :label="desk ? 'Novo cartão' : undefined" aria-label="Novo cartão" @click="openSheet('T09')" />
    </div>
    <q-btn-toggle v-model="S.cardView" spread no-caps unelevated toggle-color="primary" style="border:1px solid var(--app-line)"
      :options="[{ label: 'Visão gasto', value: 'gasto' }, { label: 'Visão caixa', value: 'caixa' }]" />
    <div class="lbl">{{ S.cardView === 'gasto' ? 'Compras feitas neste período, pela data da compra. É o que conta nos seus limites.' : 'Faturas que vencem e são pagas neste período, com o salário de 15/10.' }}</div>
    <div :class="desk ? 'grid-3' : 'stack'">
      <q-card v-for="c in CARTOES" :key="c.id">
        <q-card-section class="stack">
          <div class="row items-center no-wrap" style="gap:8px">
            <q-icon name="sym_r_credit_card" size="22px" color="primary" />
            <b style="font-size:16px">{{ c.nome }}</b>
            <q-badge v-if="c.familia" color="secondary" label="família" />
            <q-space /><span class="lbl">{{ c.bandeira }}</span>
          </div>
          <template v-if="S.cardView === 'gasto'">
            <limite v-if="c.limitePeriodo" label="Compras no período" :usado="c.gastoPeriodo" :total="c.limitePeriodo" />
            <div v-else class="row-money"><span class="text-muted">Compras no período</span><b>{{ brl(c.gastoPeriodo) }}</b></div>
          </template>
          <template v-else>
            <div class="row-money"><span class="text-muted">Fatura de {{ c.faturaCaixa.venc }}</span><b>{{ brl(c.faturaCaixa.valor) }}</b></div>
            <div class="row-money"><span class="text-muted">Situação</span><q-badge :color="c.faturaCaixa.status === 'Paga' ? 'positive' : 'warning'" :label="c.faturaCaixa.status" /></div>
            <div v-if="c.faturaCaixa.suaParte" class="row-money"><span class="text-muted">Sua parte</span><span>{{ brl(c.faturaCaixa.suaParte) }}</span></div>
          </template>
          <q-separator />
          <div class="row-money lbl"><span>Limite usado {{ brl(c.usado) }} de {{ brl(c.limite) }}</span></div>
          <div class="row items-center"><span class="lbl">Fecha dia {{ c.fecha }} · vence dia {{ c.vence }}</span><q-space /><q-btn flat dense no-caps color="primary" label="Ver fatura" @click="ver(c)" /></div>
        </q-card-section>
      </q-card>
    </div>
  </div>`,
});

/* T08 · Fatura do cartão (RF15, RF16) */
app.component('s-t08', {
  mixins: [modeProps],
  computed: {
    c() { return CARTOES.find(x => x.id === S.cardSel); },
    itens() { return this.c.id === 'nubank' ? FATURA_NUBANK : []; },
    parcelas() { return FATURA_NUBANK.filter(i => i.parc).reduce((s, i) => s + i.valor, 0); },
    novas() { return FATURA_NUBANK.filter(i => !i.parc).reduce((s, i) => s + i.valor, 0); },
  },
  template: `<div class="stack">
    <div class="row items-center no-wrap" style="gap:4px">
      <q-btn flat round dense icon="sym_r_arrow_back" aria-label="Voltar para cartões" @click="go('T07')" />
      <div class="col"><div class="lbl">{{ c.nome }}</div><h2 class="sec-title" :style="desk ? '' : 'font-size:18px'">Fatura de {{ c.faturaAberta.venc }}</h2>
        <div class="lbl">Fecha em {{ c.faturaAberta.fecha }} · paga no período Novembro, com o salário de 15/11</div></div>
      <q-badge color="info" label="aberta" />
    </div>
    <div :style="desk ? 'display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;align-items:start' : ''" :class="desk ? '' : 'stack'">
      <q-card :style="desk ? 'order:2' : ''">
        <q-card-section class="stack">
          <div class="lbl">Total até agora</div>
          <div class="big-num">{{ brl(c.faturaAberta.valor) }}</div>
          <template v-if="c.id === 'nubank'">
            <div class="row-money"><span class="text-muted">Parcelas de compras antigas</span><span>{{ brl(parcelas) }}</span></div>
            <div class="row-money"><span class="text-muted">Compras deste período</span><span>{{ brl(novas) }}</span></div>
            <q-separator />
            <div class="row-money"><span class="text-muted">Fatura ideal para bater as metas</span><b>{{ brl(c.faturaAberta.ideal) }}</b></div>
            <div class="suri-tip"><span v-html="suriSvg('vigia', 36)"></span><p>Ainda cabem <b class="tnum">{{ brl(c.faturaAberta.ideal - c.faturaAberta.valor) }}</b> nesta fatura sem atrasar as metas.</p></div>
          </template>
        </q-card-section>
      </q-card>
      <q-card>
        <div v-if="!itens.length" class="q-pa-md lbl">No protótipo, só a fatura do Nubank tem compras de exemplo.</div>
        <table v-else-if="desk" class="tbl">
          <thead><tr><th>Data da compra</th><th>Descrição</th><th>Categoria</th><th>Parcela</th><th class="r">Valor</th></tr></thead>
          <tbody><tr v-for="i in itens" :key="i.desc"><td class="text-muted">{{ i.data }}</td><td>{{ i.desc }}</td><td>{{ i.cat }}</td><td><q-badge v-if="i.parc" outline color="primary" :label="i.parc" /></td><td class="r">{{ brl(i.valor) }}</td></tr></tbody>
        </table>
        <q-list v-else separator>
          <q-item v-for="i in itens" :key="i.desc">
            <q-item-section><q-item-label>{{ i.desc }} <q-badge v-if="i.parc" outline color="primary" :label="i.parc" /></q-item-label><q-item-label caption class="tnum">{{ i.data }} · {{ i.cat }}</q-item-label></q-item-section>
            <q-item-section side class="tnum">{{ brl(i.valor) }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </div>`,
});

/* T09 · Novo cartão (RF13) */
app.component('s-t09', {
  mixins: [modeProps],
  computed: { c() { return S.cartaoNovo; } },
  methods: { salvar() { S.sheet = null; toast('Cartão salvo. No protótipo, nada é gravado.'); } },
  template: `<div class="stack">
    <h3>Novo cartão</h3>
    <q-input id="t09-limite" outlined v-model="c.limite" label="Limite" prefix="R$" input-class="tnum" />
    <q-input id="t09-nome" outlined dense v-model="c.nome" label="Nome do cartão" placeholder="Ex.: Itaú Click" />
    <div class="lbl">Bandeira</div>
    <q-btn-toggle v-model="c.bandeira" no-caps unelevated toggle-color="primary" :options="['Visa','Mastercard','Elo','Outra'].map(b => ({ label: b, value: b }))" />
    <div class="lbl">Conta que paga a fatura</div>
    <q-btn-toggle v-model="c.conta" no-caps unelevated toggle-color="primary" :options="['Conta Pessoal','Conta Familiar'].map(b => ({ label: b, value: b }))" />
    <div class="row q-col-gutter-sm">
      <div class="col-6"><q-input id="t09-fecha" outlined dense v-model.number="c.fecha" type="number" min="1" max="31" label="Dia de fechamento" /></div>
      <div class="col-6"><q-input id="t09-vence" outlined dense v-model.number="c.vence" type="number" min="1" max="31" label="Dia de vencimento" /></div>
    </div>
    <q-toggle id="t09-comp" v-model="c.compartilhado" label="Cartão do casal (dividido com a família)" />
    <div class="suri-tip"><span v-html="suriSvg('vigia', 36)"></span><p>Compras do dia {{ c.fecha }} até o dia {{ c.fecha > 1 ? c.fecha - 1 : 31 }} do mês seguinte vão para a fatura do dia {{ c.vence }}.</p></div>
    <div class="row justify-end" style="gap:8px">
      <q-btn flat color="primary" label="Cancelar" @click="S.sheet = null" /><q-btn unelevated color="primary" label="Salvar" @click="salvar" />
    </div>
  </div>`,
});

/* T10 · Contas (RF08, RF36) */
app.component('s-t10', {
  mixins: [modeProps],
  template: `<div class="stack">
    <div class="row items-center" style="gap:8px">
      <h2 class="sec-title">Contas</h2><q-space />
      <q-btn outline color="primary" icon="sym_r_add" :label="desk ? 'Nova conta' : undefined" aria-label="Nova conta" @click="openSheet('T11')" />
    </div>
    <div :class="desk ? 'grid-2' : 'row'" :style="desk ? '' : 'gap:8px'">
      <q-card :class="desk ? '' : 'col'"><q-card-section><div class="lbl">Nas suas contas</div><div class="big-num" style="font-size:22px">{{ brl(1840) }}</div></q-card-section></q-card>
      <q-card :class="desk ? '' : 'col'"><q-card-section><div class="lbl">Na conta familiar</div><div class="big-num" style="font-size:22px">{{ brl(3900) }}</div><div class="lbl">Já é da casa</div></q-card-section></q-card>
    </div>
    <div :class="desk ? 'grid-3' : 'stack'">
      <q-card v-for="c in CONTAS" :key="c.nome">
        <q-card-section class="stack">
          <div class="row items-center no-wrap" style="gap:10px">
            <q-avatar size="36px" :style="{ background: c.cor }" text-color="white" icon="sym_r_account_balance" />
            <div class="col"><b>{{ c.nome }}</b><div class="lbl">{{ c.banco }} · {{ c.tipo }}</div></div>
          </div>
          <div class="row-money"><span class="text-muted">Saldo atual</span><b>{{ brl(c.saldo) }}</b></div>
          <div v-if="!c.familia" class="row-money"><span class="text-muted">Previsto em 14/11</span><span>{{ brl(c.previsto) }}</span></div>
          <div v-else class="suri-tip" style="padding:8px"><p class="lbl" style="color:inherit">Dinheiro da casa: não entra no seu disponível. Sua parte deste período já foi transferida.</p></div>
        </q-card-section>
      </q-card>
    </div>
  </div>`,
});

/* T11 · Nova conta (RF08) */
app.component('s-t11', {
  mixins: [modeProps],
  computed: { c() { return S.contaNova; } },
  methods: {
    tipo(t) { this.c.tipo = t; if (t === 'Familiar') this.c.soma = false; },
    salvar() { S.sheet = null; toast('Conta salva. No protótipo, nada é gravado.'); },
  },
  template: `<div class="stack">
    <h3>Nova conta</h3>
    <q-input id="t11-saldo" outlined v-model="c.saldo" label="Saldo de hoje" prefix="R$" input-class="tnum" />
    <q-input id="t11-nome" outlined dense v-model="c.nome" label="Nome" placeholder="Ex.: Conta salário" />
    <div class="lbl">Banco</div>
    <div class="row" style="gap:4px"><q-chip v-for="b in ['Nubank','Inter','Itaú','Banco do Brasil','Caixa','Outro']" :key="b" clickable dense
      :color="c.banco === b ? 'primary' : undefined" :text-color="c.banco === b ? 'white' : undefined" @click="c.banco = b">{{ b }}</q-chip></div>
    <div class="lbl">Tipo</div>
    <div class="row" style="gap:4px"><q-chip v-for="t in ['Conta corrente','Dinheiro','Poupança','Investimentos','VR/VA','Familiar']" :key="t" clickable dense
      :color="c.tipo === t ? 'primary' : undefined" :text-color="c.tipo === t ? 'white' : undefined" @click="tipo(t)">{{ t }}</q-chip></div>
    <div class="lbl">Cor</div>
    <div class="row" style="gap:8px">
      <button v-for="cor in ['#A85A2A','#2F5D50','#8A05BE','#FF7A00','#1565C0','#6D4C41']" :key="cor" type="button" class="swatch" :class="{ on: c.cor === cor }"
        :style="{ background: cor }" :aria-label="'Cor ' + cor" @click="c.cor = cor"></button>
    </div>
    <q-toggle id="t11-soma" v-model="c.soma" :disable="c.tipo === 'Familiar'" label="Entra no meu disponível" />
    <div v-if="c.tipo === 'Familiar'" class="lbl">Conta familiar: o dinheiro é da casa, então fica fora do seu disponível.</div>
    <div class="row justify-end" style="gap:8px">
      <q-btn flat color="primary" label="Cancelar" @click="S.sheet = null" /><q-btn unelevated color="primary" label="Salvar" @click="salvar" />
    </div>
  </div>`,
});

/* T12 · Família (RF18, RF19, RF36) */
app.component('s-t12', {
  mixins: [modeProps],
  computed: { pagas() { return S.casa.filter(c => c.pago).length; }, metade() { return CASA_TOTAL / 2; } },
  methods: { repasse() { S.repasseAgatha = !S.repasseAgatha; toast(S.repasseAgatha ? 'Repasse da Agatha confirmado.' : 'Repasse marcado como a receber.'); } },
  template: `<div class="stack">
    <h2 class="sec-title">Família</h2>
    <q-card>
      <q-card-section :class="desk ? 'grid-3' : 'stack'">
        <div><div class="lbl">Contas da casa no período</div><div class="big-num" style="font-size:24px">{{ brl(CASA_TOTAL) }}</div><div class="lbl">Conta Familiar · Inter</div></div>
        <div><div class="lbl">Sua parte (50%)</div><b class="tnum" style="font-size:18px">{{ brl(metade) }}</b><div><q-badge color="positive" label="transferida em 16/10 · comprometida" /></div></div>
        <div><div class="lbl">Agatha (50%)</div><b class="tnum" style="font-size:18px">{{ brl(metade) }}</b><div><q-badge :color="S.repasseAgatha ? 'positive' : 'warning'" :label="S.repasseAgatha ? 'repassada' : 'a receber'" /></div></div>
      </q-card-section>
    </q-card>
    <q-tabs v-if="!desk" v-model="S.famTab" dense align="justify" active-color="primary" indicator-color="primary" no-caps>
      <q-tab name="contas" label="Contas" /><q-tab name="repasses" label="Repasses" /><q-tab name="cartao" label="Cartão" />
    </q-tabs>
    <div :class="desk ? 'grid-2' : 'stack'">
      <q-card v-if="desk || S.famTab === 'contas'">
        <q-card-section class="row items-center" style="padding-bottom:0"><b>Contas da casa</b><q-space /><span class="lbl">{{ pagas }} de {{ S.casa.length }} pagas</span></q-card-section>
        <q-list separator>
          <q-item v-for="(c, i) in S.casa" :key="c.desc" tag="label">
            <q-item-section avatar><q-checkbox :id="'t12-c' + i" v-model="c.pago" color="positive" /></q-item-section>
            <q-item-section><q-item-label :style="c.pago ? 'text-decoration:line-through;opacity:.65' : ''">{{ c.desc }}</q-item-label>
              <q-item-label caption class="tnum">vence {{ c.venc }}<q-badge v-if="c.naoAtrasar" color="warning" class="badge-late q-ml-xs" label="não pode atrasar" /></q-item-label></q-item-section>
            <q-item-section side class="tnum">{{ brl(c.valor) }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
      <div class="stack">
        <q-card v-if="desk || S.famTab === 'repasses'">
          <q-card-section class="stack">
            <b>Repasses do período</b>
            <div class="row items-center no-wrap" style="gap:10px">
              <q-icon name="sym_r_check_circle" color="positive" size="22px" />
              <div class="col"><div>Você transferiu {{ brl(metade) }}</div><div class="lbl">16/10 · já saiu do seu disponível</div></div>
            </div>
            <div class="row items-center no-wrap" style="gap:10px">
              <q-icon :name="S.repasseAgatha ? 'sym_r_check_circle' : 'sym_r_schedule'" :color="S.repasseAgatha ? 'positive' : 'warning'" size="22px" />
              <div class="col"><div>Agatha {{ S.repasseAgatha ? 'repassou' : 'ainda não repassou' }} {{ brl(metade) }}</div><div class="lbl">Confirme quando o dinheiro cair na conta familiar</div></div>
              <q-btn :outline="!S.repasseAgatha" unelevated color="positive" no-caps :label="S.repasseAgatha ? 'Confirmado' : 'Confirmar'" @click="repasse" />
            </div>
            <q-btn outline color="primary" icon="sym_r_swap_horiz" label="Transferir minha parte" disable />
            <div class="lbl">Sua parte deste período já foi transferida. O botão volta no próximo período.</div>
          </q-card-section>
        </q-card>
        <q-card v-if="desk || S.famTab === 'cartao'">
          <q-card-section class="stack">
            <div class="row items-center"><q-icon name="sym_r_credit_card" color="secondary" size="20px" class="q-mr-sm" /><b>Cartão do casal · Inter</b></div>
            <div class="row-money"><span class="text-muted">Fatura de 20/10</span><span>{{ brl(466.58) }} <q-badge color="positive" label="paga" /></span></div>
            <div class="row-money"><span class="text-muted">Fatura de 20/11, aberta</span><b>{{ brl(612.4) }}</b></div>
            <q-list dense>
              <q-item><q-item-section>Mercado do mês</q-item-section><q-item-section side class="tnum">{{ brl(380.4) }}</q-item-section></q-item>
              <q-item><q-item-section>Combustível</q-item-section><q-item-section side class="tnum">{{ brl(232) }}</q-item-section></q-item>
            </q-list>
            <div class="row-money"><span class="text-muted">Sua parte da fatura aberta</span><span>{{ brl(306.2) }}</span></div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>`,
});

/* T13 · Planejamento do período (RF21, RF22) */
app.component('s-t13', {
  mixins: [modeProps],
  methods: { cor(p) { const r = p.gasto / p.plan; return r >= 1 ? 'negative' : r >= 0.8 ? 'warning' : 'positive'; } },
  template: `<div class="stack">
    <div class="row items-center" style="gap:8px">
      <h2 class="sec-title">Planejamento · {{ PERIODOS[S.periodo].nome }}</h2><q-space />
      <q-btn v-if="desk" flat color="primary" no-caps icon="sym_r_event_repeat" label="Adicionar exceção" @click="toast('Exemplo: Restaurante passa para R$ 350 a partir do período Junho.')" />
      <q-btn v-if="desk" outline color="primary" no-caps icon="sym_r_content_copy" label="Copiar para os próximos períodos" @click="toast('Planejamento copiado para Novembro e Dezembro.')" />
    </div>
    <div class="lbl">Contado pela data da compra: o que você gasta neste período, no cartão ou na conta.</div>
    <div :class="desk ? 'grid-2' : 'stack'">
      <q-card><q-card-section><limite label="Cartão" :usado="420" :total="1000" /></q-card-section></q-card>
      <q-card><q-card-section><limite label="Débito e Pix" :usado="134" :total="300" /></q-card-section></q-card>
    </div>
    <q-card v-if="desk">
      <table class="tbl">
        <thead><tr><th>Categoria</th><th class="r">Planejado</th><th class="r">Gasto</th><th class="r">Restante</th><th style="width:30%">Uso</th></tr></thead>
        <tbody><tr v-for="p in PLANO" :key="p.cat">
          <td><q-icon :name="p.icon" size="18px" class="q-mr-sm text-muted" />{{ p.cat }}</td><td class="r">{{ brl(p.plan) }}</td><td class="r">{{ brl(p.gasto) }}</td><td class="r">{{ brl(p.plan - p.gasto) }}</td>
          <td><q-linear-progress :value="Math.min(1, p.gasto / p.plan)" :color="cor(p)" rounded size="8px" :aria-label="'Uso de ' + p.cat" /></td>
        </tr></tbody>
      </table>
    </q-card>
    <q-card v-else>
      <q-list separator>
        <q-item v-for="p in PLANO" :key="p.cat">
          <q-item-section avatar><q-icon :name="p.icon" /></q-item-section>
          <q-item-section>
            <div class="row-money"><span>{{ p.cat }}</span><span class="text-muted">{{ brl(p.gasto) }} de {{ brl(p.plan) }}</span></div>
            <q-linear-progress :value="Math.min(1, p.gasto / p.plan)" :color="cor(p)" rounded size="6px" style="margin-top:6px" :aria-label="'Uso de ' + p.cat" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
    <div v-if="!desk" class="row" style="gap:8px">
      <q-btn class="col" outline color="primary" no-caps label="Copiar para os próximos" @click="toast('Planejamento copiado para Novembro e Dezembro.')" />
      <q-btn class="col" flat color="primary" no-caps label="Adicionar exceção" @click="toast('Exemplo: Restaurante passa para R$ 350 a partir do período Junho.')" />
    </div>
  </div>`,
});

/* T14 · Categorias (RF10) */
app.component('s-t14', {
  mixins: [modeProps],
  data: () => ({ tipo: 'despesas' }),
  template: `<div class="stack">
    <div class="row items-center" style="gap:8px">
      <h2 class="sec-title">Categorias</h2><q-space />
      <q-btn outline color="primary" icon="sym_r_add" :label="desk ? 'Nova categoria' : undefined" aria-label="Nova categoria" @click="toast('No protótipo, o formulário de categoria não está desenhado.')" />
    </div>
    <q-btn-toggle v-model="tipo" no-caps unelevated toggle-color="primary" style="align-self:start;border:1px solid var(--app-line)"
      :options="[{ label: 'Despesas', value: 'despesas' }, { label: 'Receitas', value: 'receitas' }]" />
    <div v-if="tipo === 'receitas'" class="lbl">Receitas de exemplo: Salário, Aluguel, Reembolso, Rateio, Outros.</div>
    <template v-else>
      <q-card v-if="desk">
        <table class="tbl">
          <thead><tr><th>Categoria</th><th>Subcategorias</th><th class="r">Ações</th></tr></thead>
          <tbody><tr v-for="c in CATEGORIAS" :key="c.nome">
            <td><q-avatar size="28px" :style="{ background: c.cor }" text-color="white" :icon="c.icon" class="q-mr-sm" />{{ c.nome }}</td>
            <td class="text-muted">{{ c.subs.join(', ') || '—' }}</td>
            <td class="r"><q-btn flat round dense icon="sym_r_edit" aria-label="Editar" /><q-btn flat round dense icon="sym_r_inventory_2" aria-label="Arquivar" /></td>
          </tr></tbody>
        </table>
      </q-card>
      <q-card v-else>
        <q-list separator>
          <q-expansion-item v-for="c in CATEGORIAS" :key="c.nome" :label="c.nome" :caption="c.subs.length + ' subcategorias'">
            <template #header>
              <q-item-section avatar><q-avatar size="32px" :style="{ background: c.cor }" text-color="white" :icon="c.icon" /></q-item-section>
              <q-item-section><q-item-label>{{ c.nome }}</q-item-label><q-item-label caption>{{ c.subs.length }} subcategorias</q-item-label></q-item-section>
            </template>
            <q-list dense><q-item v-for="s in c.subs" :key="s" style="padding-left:72px"><q-item-section>{{ s }}</q-item-section></q-item></q-list>
          </q-expansion-item>
        </q-list>
      </q-card>
    </template>
  </div>`,
});

/* T15 · Detalhe do lançamento (RF09, RF11) */
app.component('s-t15', {
  mixins: [modeProps],
  data: () => ({ confirmar: false, pagoLocal: {}, atrasarLocal: {} }),
  computed: {
    l() { return LANC.find(x => x.id === S.txSel) || LANC[0]; },
    pago() { return this.pagoLocal[this.l.id] ?? this.l.pago; },
    naoAtrasar: {
      get() { return this.atrasarLocal[this.l.id] ?? !!this.l.naoAtrasar; },
      set(v) { this.atrasarLocal = { ...this.atrasarLocal, [this.l.id]: v }; },
    },
  },
  methods: {
    marcar() { this.pagoLocal = { ...this.pagoLocal, [this.l.id]: !this.pago }; toast(this.pago ? 'Marcado como pago.' : 'Marcado como pendente.'); },
    mover(p) { toast('Lançamento movido para o período ' + p + '.'); },
    excluir() { this.confirmar = false; go('T05'); toast('Lançamento excluído. No protótipo, nada é apagado.'); },
  },
  template: `<div class="stack">
    <div class="row items-center no-wrap" style="gap:4px">
      <q-btn flat round dense icon="sym_r_arrow_back" aria-label="Voltar para lançamentos" @click="go('T05')" />
      <h2 class="sec-title">Lançamento</h2>
    </div>
    <div :class="desk ? 'grid-2' : 'stack'">
      <q-card>
        <q-card-section class="stack">
          <div class="lbl">{{ l.desc }}</div>
          <div class="big-num" :class="l.valor > 0 ? 'amount-in' : ''">{{ brl(l.valor) }}</div>
          <div class="row-money"><span class="text-muted">Data</span><span>{{ l.data }}/2026</span></div>
          <div class="row-money"><span class="text-muted">Categoria</span><span>{{ l.cat }}</span></div>
          <div class="row-money"><span class="text-muted">Conta ou cartão</span><span>{{ l.conta }}</span></div>
          <div class="row-money"><span class="text-muted">Período</span><span>Outubro · 15/10/2026 a 14/11/2026</span></div>
          <div class="row-money"><span class="text-muted">Situação</span><q-badge :color="pago ? 'positive' : 'warning'" :label="pago ? 'pago' : 'pendente'" /></div>
        </q-card-section>
      </q-card>
      <q-card>
        <q-card-section class="stack">
          <q-btn unelevated :color="pago ? 'grey-6' : 'positive'" :icon="pago ? 'sym_r_undo' : 'sym_r_check'" :label="pago ? 'Marcar como pendente' : 'Marcar como pago'" @click="marcar" />
          <q-toggle id="t15-atrasar" v-model="naoAtrasar" label="Não pode atrasar (perde desconto)" />
          <div class="lbl">Mover para outro período</div>
          <div class="row" style="gap:4px"><q-chip v-for="p in PERIODOS" :key="p.nome" clickable :outline="p.nome !== 'Outubro'" color="primary" :text-color="p.nome === 'Outubro' ? 'white' : 'primary'" @click="mover(p.nome)">{{ p.nome }}</q-chip></div>
          <div class="row" style="gap:8px">
            <q-btn class="col" outline color="primary" icon="sym_r_edit" label="Editar" @click="S.novo.tipo = l.tipo === 'cartao' ? 'cartao' : 'despesa'; openSheet('T06')" />
            <q-btn class="col" outline color="negative" icon="sym_r_delete" label="Excluir" @click="confirmar = true" />
          </div>
          <q-banner v-if="confirmar" rounded class="bg-negative text-white">
            Excluir "{{ l.desc }}"? Essa ação não pode ser desfeita.
            <template #action><q-btn flat label="Cancelar" @click="confirmar = false" /><q-btn flat label="Excluir" @click="excluir" /></template>
          </q-banner>
        </q-card-section>
      </q-card>
    </div>
  </div>`,
});

/* T16 · Configurações (RF04) */
app.component('s-t16', {
  mixins: [modeProps],
  methods: { refazer(i) { iniciarOnb(i); go('T03'); } },
  template: `<div class="stack">
    <h2 class="sec-title">Configurações</h2>
    <q-tabs v-model="S.cfgTab" dense :align="desk ? 'left' : 'justify'" active-color="primary" indicator-color="primary" no-caps outside-arrows mobile-arrows>
      <q-tab name="perfil" label="Perfil" /><q-tab name="periodo" label="Período" /><q-tab name="onboarding" label="Onboarding" /><q-tab name="aparencia" label="Aparência" />
    </q-tabs>
    <q-card :style="desk ? 'max-width:720px' : ''">
      <q-card-section v-if="S.cfgTab === 'perfil'" class="stack">
        <q-input id="t16-nome" outlined dense model-value="Phelipe Afonso" label="Nome" readonly />
        <q-input id="t16-email" outlined dense model-value="phelipe@exemplo.com" label="E-mail" readonly />
        <div class="lbl">No protótipo, os dados do perfil são só de leitura.</div>
      </q-card-section>
      <q-card-section v-else-if="S.cfgTab === 'periodo'" class="stack">
        <q-input id="t16-dia" outlined dense v-model.number="S.cfg.dia" type="number" min="1" max="31" label="Dia em que o salário cai" style="max-width:220px" />
        <div class="lbl">Quando cai no fim de semana ou feriado</div>
        <q-btn-toggle v-model="S.cfg.fds" no-caps unelevated toggle-color="primary" style="align-self:start"
          :options="[{ label: 'Antecipa', value: 'antecipa' }, { label: 'Adia', value: 'adia' }, { label: 'Não muda', value: 'nao-muda' }]" />
        <div class="lbl">O salário costuma atrasar?</div>
        <q-btn-toggle v-model="S.cfg.atrasa" no-caps unelevated toggle-color="primary" style="align-self:start" :options="[{ label: 'Não', value: 'nao' }, { label: 'Sim', value: 'sim' }]" />
        <q-input v-if="S.cfg.atrasa === 'sim'" id="t16-atraso" outlined dense model-value="2" label="Quantos dias, no máximo" style="max-width:220px" />
        <div class="suri-tip"><span v-html="suriSvg('vigia', 36)"></span><p>O período leva o nome do mês em que começa e mostra as datas completas: <b>{{ PERIODOS[1].nome }} · {{ PERIODOS[1].ini }} a {{ PERIODOS[1].fim }}</b>.</p></div>
      </q-card-section>
      <q-card-section v-else-if="S.cfgTab === 'onboarding'" class="stack">
        <div class="lbl">Refaça qualquer etapa do cadastro guiado pelo Suri.</div>
        <q-list separator>
          <q-item v-for="(e, i) in ETAPAS" :key="e">
            <q-item-section avatar><q-icon name="sym_r_check_circle" color="positive" /></q-item-section>
            <q-item-section>{{ i + 1 }}. {{ e }}</q-item-section>
            <q-item-section side><q-btn flat dense no-caps color="primary" label="Refazer" @click="refazer(i)" /></q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section v-else class="stack">
        <q-toggle id="t16-dark" :model-value="S.dark" label="Tema escuro" @update:model-value="setDark" />
      </q-card-section>
    </q-card>
  </div>`,
});

/* Montagem */
app.use(Quasar, {
  config: { brand: { primary: '#A85A2A', secondary: '#2F5D50', accent: '#C98E5A', positive: '#2E7D32', negative: '#C62828', warning: '#B26A00', info: '#1565C0' } },
});
Quasar.lang.set(Quasar.lang.ptBR);
Quasar.iconSet.set(Quasar.iconSet.materialSymbolsRounded);
app.mount('#app');
(() => {
  let dark = false;
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr) dark = attr === 'dark';
  else try { dark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { dark = false; }
  setDark(dark);
})();

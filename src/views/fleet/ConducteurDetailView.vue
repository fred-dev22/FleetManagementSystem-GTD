<template>
  <div :class="L.pagePadding">
    <div v-if="!score" :class="L.emptyState">
      <UserX class="w-8 h-8" />
      <p class="text-sm">Conducteur introuvable</p>
    </div>

    <template v-else>
      <!-- ── En-tête ──────────────────────────────────────────── -->
      <div :class="L.pageHeader">
        <div class="flex items-start gap-3">
          <button :class="L.tbIconBtn" @click="router.back()"><ArrowLeft class="w-4 h-4" /></button>
          <div>
            <h1 :class="L.pageTitle">{{ score.chauffeurNom }}</h1>
            <p :class="L.pageSub">
              {{ score.voyagesPeriode }} voyage(s) · {{ score.kmPeriode.toLocaleString('fr-FR') }} km sur la période
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Navigation d'un conducteur à l'autre, comme dans les fiches -->
          <div class="flex items-center gap-1">
            <button :class="L.tbIconBtn" :disabled="indexCourant <= 0"
              title="Conducteur précédent" @click="naviguer(-1)">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-[11px] text-muted-foreground px-1">
              {{ indexCourant + 1 }} / {{ scoresStore.scores.length }}
            </span>
            <button :class="L.tbIconBtn" :disabled="indexCourant >= scoresStore.scores.length - 1"
              title="Conducteur suivant" @click="naviguer(1)">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>

          <!-- Score global, décomposé sur l'onglet Score plutôt qu'affiché seul ici -->
          <div class="text-right">
            <p class="text-3xl font-bold leading-none" :class="couleurScore(score.score)">{{ score.score }}</p>
            <p class="text-[11px] text-muted-foreground">
              sur 100
              <span :class="delta >= 0 ? 'text-success' : 'text-danger'">
                ({{ delta >= 0 ? '+' : '' }}{{ delta }})
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Alertes d'échéance -->
      <div v-if="echeances.length" class="flex flex-col gap-1.5 mb-3.5">
        <div v-for="e in echeances" :key="e.type"
          class="flex items-center gap-2.5 rounded-lg px-3.5 py-2"
          :class="e.expire ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'">
          <AlertTriangle class="w-4 h-4 shrink-0" />
          <p class="text-xs flex-1">
            <strong>{{ e.type }}</strong> - {{ e.expire ? 'expiré' : 'expire' }} le {{ fmtDate(e.date) }}.
          </p>
          <span class="text-[11px] font-medium">
            {{ e.expire ? 'Affectation bloquée' : 'Régularisation requise' }}
          </span>
        </div>
      </div>

      <!-- ── Onglets ──────────────────────────────────────────── -->
      <div class="flex gap-1 border-b border-border mb-3.5 overflow-x-auto">
        <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
          class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer bg-transparent"
          :class="tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'">
          {{ t.label }}
          <span v-if="t.badge" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-bg text-danger">{{ t.badge }}</span>
        </button>
      </div>

      <!-- ══ SCORE & PRIME ══════════════════════════════════════ -->
      <div v-if="tab === 'score'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="couleurScore(score.score)">{{ score.score }} / 100</p>
            <p class="text-[11px] text-gray-500 mt-1">
              Score global
              <span :class="delta >= 0 ? 'text-success' : 'text-danger'">({{ delta >= 0 ? '+' : '' }}{{ delta }} vs mois précédent)</span>
            </p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ scoresStore.percentile(chauffeurId) }} %</p>
            <p class="text-[11px] text-gray-500 mt-1">Mieux classé que ce pourcentage des conducteurs</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="score.primeEligible ? 'text-success' : 'text-muted-foreground'">
              {{ score.primeEligible ? fmtAr(score.primeMontant) : 'Non éligible' }}
            </p>
            <p class="text-[11px] text-gray-500 mt-1">Prime de la période ({{ palierPrime.libelle }})</p>
          </div>
        </div>

        <div v-if="!score.primeEligible && score.motifNonEligibilite"
          class="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 bg-warning-bg text-warning text-xs">
          <AlertTriangle class="w-4 h-4 shrink-0 mt-px" />
          <span><strong>Prime non versée :</strong> {{ score.motifNonEligibilite }}</span>
        </div>

        <!-- Décomposition par famille -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><Gauge class="w-4 h-4 text-primary" /> Décomposition du score</h2>
          </div>
          <p class="text-[11px] text-muted-foreground mb-3 -mt-1">
            Pondérations fixées par la direction - modifiables depuis Flotte → Paramétrage.
          </p>
          <div class="flex flex-col gap-3">
            <div v-for="f in score.familles" :key="f.famille">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-foreground">{{ f.libelle }}</span>
                <span class="text-[11px] text-muted-foreground">
                  {{ f.note }} / 100 · poids {{ f.poids }} % · {{ f.evenements }} événement(s)
                </span>
              </div>
              <div class="h-1.5 bg-border rounded-sm overflow-hidden">
                <div class="h-full rounded-sm" :style="{ width: f.note + '%', background: PONDERATIONS[f.famille].couleur }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historique 12 mois -->
        <!-- <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><TrendingUp class="w-4 h-4 text-primary" /> Évolution sur 12 mois</h2>
          </div>
          <div class="flex items-end gap-1.5 h-20">
            <div v-for="(v, i) in score.historique12m" :key="i" class="flex-1 flex flex-col items-center justify-end h-full">
              <div class="w-full rounded-t-sm" :class="couleurScore(v).replace('text-', 'bg-')" :style="{ height: v + '%' }"></div>
            </div>
          </div>
        </div> -->

        <!-- Grille de prime - à valider par la direction et les RH -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><Award class="w-4 h-4 text-primary" /> Grille de prime</h2>
            <router-link :to="{ name: 'fleet-configuration' }" class="text-[11px] text-primary hover:underline">
              Modifier dans Paramétrage
            </router-link>
          </div>
          <p class="text-[11px] text-warning bg-warning-bg rounded-md px-2.5 py-2 mb-3">
            Montants indicatifs (GTD ne les a pas communiqués) - à valider par la Direction et les
            Ressources Humaines avant activation. Modifiables sans développeur depuis Flotte →
            Paramétrage, onglet Paramètres.
          </p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div v-for="p in scoresStore.grillePrime" :key="p.libelle"
              class="rounded-lg border px-3 py-2 text-center"
              :class="palierPrime.libelle === p.libelle ? 'border-primary bg-primary/5' : 'border-border'">
              <p class="text-[11px] text-muted-foreground">{{ p.libelle }}</p>
              <p class="text-sm font-semibold text-foreground">{{ p.montant ? fmtAr(p.montant) : '-' }}</p>
              <p class="text-[10px] text-muted-foreground">score ≥ {{ p.min }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ SYNTHÈSE ═══════════════════════════════════════════ -->
      <div v-if="tab === 'itineraires'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ score.tauxConformiteItineraire }} %</p>
            <p class="text-[11px] text-gray-500 mt-1">Conformité d’itinéraire</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ ecarts.length }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Écarts sur la période</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="score.depassementsKm ? 'text-warning' : ''">
              {{ score.depassementsKm }}
            </p>
            <p class="text-[11px] text-gray-500 mt-1">Dépassements km / voyage</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ score.kmMoyenParVoyage.toLocaleString('fr-FR') }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Km moyen par voyage</p>
          </div>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle">Écarts relevés</h2></div>
          <div v-if="!ecarts.length" class="text-xs text-muted-foreground py-3">Aucun écart sur la période.</div>
          <table v-else :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Écart</th>
              <th :class="L.th" class="cursor-default">Type</th>
              <th :class="L.th" class="cursor-default">Nature</th>
              <th :class="L.th" class="cursor-default">Détecté le</th>
              <th :class="L.th" class="cursor-default"></th>
            </tr></thead>
            <tbody>
              <tr v-for="e in ecarts" :key="e.id" :class="L.rowHover">
                <td :class="L.td"><span class="font-mono text-xs">{{ e.id }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ LIB_TYPE_ECART[e.type] }}</span></td>
                <td :class="L.td"><span :class="LIB_NATURE[e.nature].cls" class="text-[11px] font-medium px-2 py-0.5 rounded-full">{{ LIB_NATURE[e.nature].label }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDateTime(e.detecteLe) }}</span></td>
                <td :class="L.td"><button :class="L.actView" @click="router.push({ name: 'fleet-ecart-detail', params: { id: e.id } })">Ouvrir</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ CARBURANT ══════════════════════════════════════════ -->
      <div v-else-if="tab === 'carburant'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ score.consoMoyenne100km }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Conso moyenne (L/100 km)</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none"
              :class="score.ecartConsoPct > 5 ? 'text-danger' : score.ecartConsoPct > 0 ? 'text-warning' : 'text-success'">
              {{ score.ecartConsoPct > 0 ? '+' : '' }}{{ score.ecartConsoPct }} %
            </p>
            <p class="text-[11px] text-gray-500 mt-1">Écart à la référence trajet</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ recharges.length }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Recharges sur la période</p>
          </div>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Fuel class="w-4 h-4 text-primary" /> Recharges</h2></div>
          <table :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Date</th>
              <th :class="L.th" class="cursor-default">Véhicule</th>
              <th :class="L.th" class="cursor-default">Litres</th>
              <th :class="L.th" class="cursor-default">Lieu</th>
              <th :class="L.th" class="cursor-default">Contrôles</th>
            </tr></thead>
            <tbody>
              <tr v-for="r in recharges" :key="r.id" :class="L.rowHover">
                <td :class="L.td"><span class="text-xs">{{ fmtDateTime(r.date) }}</span></td>
                <td :class="L.td"><span class="font-mono text-xs">{{ r.vehiculePlaque }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtL(r.litres) }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ r.lieu }}</span></td>
                <td :class="L.td">
                  <span v-if="r.statut === 'valide'" class="text-[11px] px-2 py-0.5 rounded-full bg-success-bg text-success">Conforme</span>
                  <span v-else class="text-[11px] px-2 py-0.5 rounded-full bg-danger-bg text-danger">Anomalie</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ RH ═════════════════════════════════════════════════ -->
      <!-- ═══════════════════════════════════════════════════════
           DOCUMENTS - pièces du dossier conducteur
           Exigé par le CDC : « gestion des documents : permis,
           assurances, formations, certificats avec alertes et
           archivage » et « relances à J-30, escalade si non validés ».
           ═══════════════════════════════════════════════════════ -->
      <div v-else-if="tab === 'documents'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div v-for="k in kpisDocs" :key="k.label"
            class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
            <p class="text-[11px] text-gray-500 mt-1">{{ k.label }}</p>
          </div>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><FileText class="w-4 h-4 text-primary" /> Pièces du dossier</h2>
            <span class="text-[11px] text-muted-foreground">Alerte automatique {{ PREAVIS_JOURS }} jours avant échéance</span>
          </div>

          <div v-if="!documents.length" class="text-xs text-muted-foreground py-3">
            Aucune pièce enregistrée pour ce conducteur.
          </div>

          <table v-else :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Pièce</th>
              <th :class="L.th" class="cursor-default">N°</th>
              <th :class="L.th" class="cursor-default">Émission</th>
              <th :class="L.th" class="cursor-default">Expiration</th>
              <th :class="L.th" class="cursor-default">Échéance</th>
              <th :class="L.th" class="cursor-default">Statut</th>
            </tr></thead>
            <tbody>
              <tr v-for="d in documents" :key="d.id" :class="L.rowHover">
                <td :class="L.td"><span class="text-xs font-medium">{{ d.type }}</span></td>
                <td :class="L.td"><span class="font-mono text-[11px]">{{ d.numero ?? '-' }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDate(d.dateEmission) }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ d.dateExpiration ? fmtDate(d.dateExpiration) : '-' }}</span></td>
                <td :class="L.td">
                  <span class="text-xs font-medium" :class="clsEcheance(d.dateExpiration)">
                    {{ libelleEcheance(d.dateExpiration) }}
                  </span>
                </td>
                <td :class="L.td">
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="CLS_STATUT_DOC[d.statut]">
                    {{ LIB_STATUT_DOC[d.statut] }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Une pièce expirée bloque l’affectation du conducteur à un voyage. Le permis et la
            visite médicale sont les deux pièces obligatoires exigées par le cahier des charges.
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════
           FORMATIONS - habilitations et leur validité
           Exigé par le CDC GTD : « formation continue chauffeurs
           ≥ 95 % » et « formation sécurité chauffeurs ≥ 95 % ».
           ═══════════════════════════════════════════════════════ -->
      <div v-else-if="tab === 'formations'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div v-for="k in kpisFormations" :key="k.label"
            class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
            <p class="text-[11px] text-gray-500 mt-1">{{ k.label }}</p>
          </div>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><GraduationCap class="w-4 h-4 text-primary" /> Formations suivies</h2>
          </div>

          <div v-if="!formations.length" class="text-xs text-muted-foreground py-3">
            Aucune formation enregistrée.
          </div>

          <table v-else :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Formation</th>
              <th :class="L.th" class="cursor-default">Suivie le</th>
              <th :class="L.th" class="cursor-default">Valide jusqu’au</th>
              <th :class="L.th" class="cursor-default">État</th>
            </tr></thead>
            <tbody>
              <tr v-for="f in formations" :key="f.id" :class="L.rowHover">
                <td :class="L.td"><span class="text-xs font-medium">{{ f.titre }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDate(f.date) }}</span></td>
                <td :class="L.td">
                  <span class="text-xs">{{ f.dateExpiration ? fmtDate(f.dateExpiration) : 'sans échéance' }}</span>
                </td>
                <td :class="L.td">
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="clsFormation(f.dateExpiration).cls">
                    {{ clsFormation(f.dateExpiration).label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Habilitations obligatoires : ce qui manque saute aux yeux -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><ShieldCheck class="w-4 h-4 text-primary" /> Habilitations obligatoires</h2>
            <span class="text-[11px]" :class="habilitationsOk ? 'text-success' : 'text-danger'">
              {{ habilitations.filter(h => h.acquise).length }}/{{ habilitations.length }} acquises
            </span>
          </div>
          <div class="flex flex-col gap-1.5">
            <div v-for="h in habilitations" :key="h.code"
              class="flex items-start gap-2.5 rounded-md px-3 py-2"
              :class="h.acquise ? 'bg-background' : 'bg-danger-bg'">
              <component :is="h.acquise ? CheckCircle2 : XCircle" class="w-4 h-4 shrink-0 mt-px"
                :class="h.acquise ? 'text-success' : 'text-danger'" />
              <div class="min-w-0">
                <p class="text-xs font-medium" :class="h.acquise ? 'text-foreground' : 'text-danger'">{{ h.libelle }}</p>
                <p class="text-[11px] text-muted-foreground">{{ h.detail }}</p>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Un chauffeur sans habilitation APTH ou ADR valide ne peut pas conduire un camion-citerne.
            L’affectation est bloquée tant que l’habilitation n’est pas régularisée.
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════
           PLANNING - ce que le conducteur a fait et va faire
           Exigé par le CDC : « affectation & planning : association
           conducteurs/véhicules, planning dynamique prenant en compte
           les disponibilités et compétences ».
           ═══════════════════════════════════════════════════════ -->
      <div v-else-if="tab === 'planning'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div v-for="k in kpisPlanning" :key="k.label"
            class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="k.cls">{{ k.value }}</p>
            <p class="text-[11px] text-gray-500 mt-1">{{ k.label }}</p>
          </div>
        </div>

        <!-- Disponibilité immédiate : la réponse à « peut-il partir demain ? » -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><CalendarCheck class="w-4 h-4 text-primary" /> Disponibilité</h2>
          </div>
          <div class="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
            :class="disponibilite.ok ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'">
            <component :is="disponibilite.ok ? CheckCircle2 : AlertTriangle" class="w-4 h-4 shrink-0 mt-px" />
            <div>
              <p class="text-xs font-medium">{{ disponibilite.titre }}</p>
              <p v-if="disponibilite.motifs.length" class="text-[11px] leading-snug mt-0.5">
                {{ disponibilite.motifs.join(' · ') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Voyages : passés et à venir -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><Package class="w-4 h-4 text-primary" /> Voyages</h2>
            <span class="text-[11px] text-muted-foreground">{{ voyagesConducteur.length }} sur la période</span>
          </div>

          <div v-if="!voyagesConducteur.length" class="text-xs text-muted-foreground py-3">
            Aucun voyage affecté à ce conducteur.
          </div>

          <table v-else :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Voyage</th>
              <th :class="L.th" class="cursor-default">Trajet</th>
              <th :class="L.th" class="cursor-default">Véhicule</th>
              <th :class="L.th" class="cursor-default">Date</th>
              <th :class="L.th" class="cursor-default">Statut</th>
              <th :class="L.th" class="cursor-default"></th>
            </tr></thead>
            <tbody>
              <tr v-for="v in voyagesConducteur" :key="v.id" :class="L.rowHover">
                <td :class="L.td"><span class="font-mono text-xs font-semibold">{{ v.reference }}</span></td>
                <td :class="L.td">
                  <span class="text-xs">{{ v.origine }} → {{ v.destination }}</span>
                  <div class="text-[11px] text-muted-foreground">{{ v.etapes.length }} site(s)</div>
                </td>
                <td :class="L.td"><span class="font-mono text-xs">{{ v.vehiculePlaque ?? '-' }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDate(v.datePlanifiee) }}</span></td>
                <td :class="L.td">
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-full" :class="CLS_STATUT_VOYAGE[v.statut]">
                    {{ LIB_STATUT_VOYAGE[v.statut] }}
                  </span>
                </td>
                <td :class="L.td">
                  <button :class="L.actView" @click="router.push({ name: 'fleet-voyage-detail', params: { id: v.id } })">
                    Ouvrir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Absences : elles rendent le chauffeur indisponible -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><CalendarOff class="w-4 h-4 text-primary" /> Absences et congés</h2>
            <span class="text-[11px] text-muted-foreground">source : module Administration</span>
          </div>

          <div v-if="!absencesConducteur.length" class="text-xs text-muted-foreground py-3">
            Aucune absence enregistrée sur la période.
          </div>

          <table v-else :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Type</th>
              <th :class="L.th" class="cursor-default">Du</th>
              <th :class="L.th" class="cursor-default">Au</th>
              <th :class="L.th" class="cursor-default">Statut</th>
            </tr></thead>
            <tbody>
              <tr v-for="a in absencesConducteur" :key="a.id" :class="L.rowHover">
                <td :class="L.td"><span class="text-xs font-medium">{{ a.type }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDate(a.startDate) }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDate(a.endDate) }}</span></td>
                <td :class="L.td"><span class="text-[11px] text-muted-foreground">{{ a.status }}</span></td>
              </tr>
            </tbody>
          </table>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Une absence en cours rend le conducteur indisponible : le code CON pour un congé,
            TRH pour un repos, MED pour une visite médicale, selon la nomenclature de GTD.
          </p>
        </div>
      </div>

      <div v-else-if="tab === 'rh'" class="flex flex-col gap-3.5">
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><IdCard class="w-4 h-4 text-primary" /> Données administratives</h2>
          </div>
          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
            <div><dt class="text-muted-foreground text-[11px]">Permis de conduire</dt>
              <dd :class="estProche(score.permisExpireLe) ? 'text-danger font-medium' : ''">
                expire le {{ fmtDate(score.permisExpireLe) }}</dd></div>
            <div><dt class="text-muted-foreground text-[11px]">Visite médicale</dt>
              <dd :class="estProche(score.visiteMedicaleExpireLe) ? 'text-danger font-medium' : ''">
                expire le {{ fmtDate(score.visiteMedicaleExpireLe) }}</dd></div>
            <div><dt class="text-muted-foreground text-[11px]">Voyages sur la période</dt>
              <dd>{{ score.voyagesPeriode }}</dd></div>
            <div><dt class="text-muted-foreground text-[11px]">Kilométrage cumulé</dt>
              <dd>{{ score.kmPeriode.toLocaleString('fr-FR') }} km</dd></div>
            <div><dt class="text-muted-foreground text-[11px]">Infractions de conduite</dt><dd>{{ score.infractions }}</dd></div>
            <div><dt class="text-muted-foreground text-[11px]">Excès de vitesse</dt><dd>{{ score.exces }}</dd></div>
          </dl>
        </div>

        <!-- Absences - déjà suivies dans le module Congés (stores/absences.ts) -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><CalendarOff class="w-4 h-4 text-primary" /> Absences</h2>
            <span class="text-[11px] text-muted-foreground">{{ absencesConducteur.length }} demande(s)</span>
          </div>
          <div v-if="!absencesConducteur.length" class="text-xs text-muted-foreground py-2">Aucune absence enregistrée.</div>
          <ul v-else class="flex flex-col gap-1.5">
            <li v-for="a in absencesConducteur.slice(0, 5)" :key="a.id" class="flex items-center justify-between text-xs">
              <span>{{ a.type }} · {{ a.startDate }} → {{ a.endDate }}</span>
              <StatusPill :status="a.status" />
            </li>
          </ul>
        </div>

        <!-- Infractions internes & sanctions - registre structuré (US RH),
             distinct des infractions de conduite (ci-dessus, liées au trajet). -->
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><AlertCircle class="w-4 h-4 text-primary" /> Infractions internes & sanctions</h2>
            <span v-if="sanctionsEnCoursConducteur.length" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-warning-bg text-warning">
              {{ sanctionsEnCoursConducteur.length }} en cours
            </span>
          </div>

          <div v-if="!sanctionsConducteur.length" class="text-xs text-muted-foreground py-2">
            Aucune infraction interne enregistrée pour ce conducteur.
          </div>

          <ul v-else class="flex flex-col gap-2.5">
            <li v-for="s in sanctionsConducteur" :key="s.id" class="rounded-lg border border-border px-3 py-2.5">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-foreground">{{ LIB_NATURE_SANCTION[s.nature] }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ fmtDate(s.date) }} · signalé par {{ s.responsable }}</p>
                </div>
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0" :class="CLS_STATUT_SANCTION[s.statut]">
                  {{ LIB_STATUT_SANCTION[s.statut] }}
                </span>
              </div>
              <p class="text-xs text-foreground mt-1.5 leading-relaxed">{{ s.description }}</p>
              <div class="flex items-center gap-3 mt-1.5 flex-wrap">
                <span v-if="s.sanction" class="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {{ LIB_TYPE_SANCTION[s.sanction] }}
                </span>
                <span v-if="s.voyageRef" class="text-[11px] font-mono text-muted-foreground">Voyage {{ s.voyageRef }}</span>
                <span v-if="s.dateCloture" class="text-[11px] text-muted-foreground">Clôturée le {{ fmtDate(s.dateCloture) }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
</div>
</template>

<script setup lang="ts">
/**
 * Fiche conducteur unifiée - point de jonction entre le module RH et le module Flotte.
 * Le score est présenté décomposé : un score opaque est un score contesté.
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, UserX, Gauge, TrendingUp, Award, AlertTriangle, Fuel, IdCard, Users,
  FileText, GraduationCap, ShieldCheck, CheckCircle2, XCircle, CalendarCheck, CalendarOff, Package,
  ClipboardCheck, AlertCircle, FileQuestion,
  ChevronLeft, ChevronRight,
} from 'lucide-vue-next'
import {
  useScoresConducteursStore, PONDERATIONS,
} from '../../stores/scoresConducteurs'
import type { LeaveRequest } from '../../types'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE } from '../../stores/ecarts'
import { useCarburantStore } from '../../stores/carburant'
import { useDocumentsVehiculesStore } from '../../stores/documentsVehicules'
import { useConduceteursProfilesStore } from '../../stores/conducteursProfiles'
import { useVoyagesStore } from '../../stores/voyages'
import { useConfigurationStore } from '../../stores/configuration'
import { useAbsenceStore } from '../../stores/absences'
import { useSanctionsRHStore } from '../../stores/sanctionsRH'
import { LIB_NATURE_SANCTION, LIB_TYPE_SANCTION, LIB_STATUT_SANCTION, CLS_STATUT_SANCTION } from '../../types/rh'
import { StatusPill } from '../../components'
import { fmtAr, fmtL, fmtDate, fmtDateTime } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'

const route  = useRoute()
const router = useRouter()
const scoresStore    = useScoresConducteursStore()
const ecartsStore    = useEcartsStore()
const carburantStore = useCarburantStore()
const docsStore      = useDocumentsVehiculesStore()
const profilsStore   = useConduceteursProfilesStore()
const voyagesStore   = useVoyagesStore()
const absencesStore  = useAbsenceStore()
const sanctionsStore = useSanctionsRHStore()

const chauffeurId = computed(() => String(route.params.id))
const score = computed(() => scoresStore.getById(chauffeurId.value))

const sanctionsConducteur = computed(() => sanctionsStore.sanctionsDeLEmploye(chauffeurId.value))
const sanctionsEnCoursConducteur = computed(() => sanctionsConducteur.value.filter(s => s.statut === 'en_cours'))

type OngletFiche = 'score' | 'itineraires' | 'carburant' | 'documents' | 'formations' | 'planning' | 'rh'

const tab = ref<OngletFiche>('score')

/* Les six onglets exigés par le cahier des charges FMS Trucks :
   « Fiche conducteur : profil, documents, infractions, score, formations, planning ».
   L'onglet Score était manquant : le score global s'affichait sans décomposition
   ni lien vers la prime, alors que c'est justement l'écran où le client doit
   pouvoir expliquer au chauffeur d'où viennent ses points perdus (US 10.3.1/10.3.2). */
const tabs = computed(() => [
  { key: 'score' as const,       label: 'Score & prime', badge: 0 },
  { key: 'itineraires' as const, label: 'Itinéraires', badge: 0 },
  { key: 'carburant' as const,   label: 'Carburant',   badge: 0 },
  { key: 'documents' as const,   label: 'Documents',   badge: docsAlerte.value },
  { key: 'formations' as const,  label: 'Formations',  badge: formationsAlerte.value },
  { key: 'planning' as const,    label: 'Planning',    badge: 0 },
  { key: 'rh' as const,          label: 'Ressources humaines', badge: 0 },
])

const delta = computed(() => (score.value?.score ?? 0) - (score.value?.scoreMoisPrecedent ?? 0))

/** Palier de la grille de prime correspondant au score, indépendamment de l'éligibilité. */
const palierPrime = computed(() => {
  const grille = scoresStore.grillePrime
  return grille.find(g => (score.value?.score ?? 0) >= g.min) ?? grille[grille.length - 1]!
})

/* ── Navigation d'un conducteur à l'autre, sans repasser par la liste ── */
const indexCourant = computed(() =>
  scoresStore.scores.findIndex(s => s.chauffeurId === chauffeurId.value))

function naviguer(delta: number) {
  const cible = scoresStore.scores[indexCourant.value + delta]
  if (cible) router.replace({ name: 'fleet-conducteur-detail', params: { id: cible.chauffeurId } })
}

/* ═══════════════════════════════════════════════════════════════
   ONGLET DOCUMENTS
   Le store de documents est unifié véhicule + conducteur : on filtre
   sur l'entité conducteur. Règle du cahier des charges : alerte à J-30.
   ═══════════════════════════════════════════════════════════════ */
const configStore = useConfigurationStore()
const PREAVIS_JOURS = computed(() => configStore.parametres.preavisDocumentaireJours)

/* Le référentiel documentaire indexe les pièces par identifiant de PROFIL
   conducteur (CP-00x), pas par identifiant d'employé (emp-0xx). On passe
   donc par le profil pour retrouver les pièces du bon conducteur. */
const profil = computed(() => profilsStore.getByEmployeId(chauffeurId.value))

const documents = computed(() =>
  profil.value ? docsStore.getDocsByConducteur(profil.value.id) : [])

/** Jours restants avant expiration - négatif si déjà expiré. */
function joursRestants(iso?: string): number | null {
  if (!iso) return null
  return Math.ceil((+new Date(iso) - Date.now()) / 86_400_000)
}

function libelleEcheance(iso?: string): string {
  const j = joursRestants(iso)
  if (j === null) return 'sans échéance'
  if (j < 0) return `expiré depuis ${Math.abs(j)} j`
  if (j <= PREAVIS_JOURS.value) return `dans ${j} j`
  return `dans ${j} j`
}

function clsEcheance(iso?: string): string {
  const j = joursRestants(iso)
  if (j === null) return 'text-muted-foreground'
  if (j < 0) return 'text-danger'
  if (j <= PREAVIS_JOURS.value) return 'text-warning'
  return 'text-success'
}

const LIB_STATUT_DOC: Record<string, string> = {
  depose: 'Déposé', valide: 'Validé', refuse: 'Refusé', archive: 'Archivé',
}
const CLS_STATUT_DOC: Record<string, string> = {
  depose:  'bg-info-bg text-info',
  valide:  'bg-success-bg text-success',
  refuse:  'bg-danger-bg text-danger',
  archive: 'bg-gray-100 text-gray-500',
}

const docsExpires = computed(() =>
  documents.value.filter(d => (joursRestants(d.dateExpiration) ?? 1) < 0).length)

const docsProches = computed(() =>
  documents.value.filter(d => {
    const j = joursRestants(d.dateExpiration)
    return j !== null && j >= 0 && j <= PREAVIS_JOURS.value
  }).length)

/** Pastille rouge sur l'onglet : expirés + proches de l'échéance. */
const docsAlerte = computed(() => docsExpires.value + docsProches.value)

const kpisDocs = computed(() => [
  { label: 'Pièces au dossier', value: String(documents.value.length), cls: 'text-foreground' },
  { label: 'Validées',          value: String(documents.value.filter(d => d.statut === 'valide').length), cls: 'text-success' },
  { label: 'À renouveler',      value: String(docsProches.value), cls: docsProches.value ? 'text-warning' : 'text-foreground' },
  { label: 'Expirées',          value: String(docsExpires.value), cls: docsExpires.value ? 'text-danger' : 'text-foreground' },
])

/* ═══════════════════════════════════════════════════════════════
   ONGLET FORMATIONS
   Les formations vivent dans le profil conducteur. On y ajoute le
   contrôle des habilitations obligatoires au transport d'hydrocarbures.
   ═══════════════════════════════════════════════════════════════ */
const formations = computed(() => profil.value?.formations ?? [])

function clsFormation(iso?: string): { label: string; cls: string } {
  const j = joursRestants(iso)
  if (j === null) return { label: 'Acquise',  cls: 'bg-success-bg text-success' }
  if (j < 0)      return { label: 'Expirée',  cls: 'bg-danger-bg text-danger'   }
  if (j <= PREAVIS_JOURS.value) return { label: 'À renouveler', cls: 'bg-warning-bg text-warning' }
  return { label: 'Valide', cls: 'bg-success-bg text-success' }
}

const formationsExpirees = computed(() =>
  formations.value.filter(f => (joursRestants(f.dateExpiration) ?? 1) < 0).length)

const formationsProches = computed(() =>
  formations.value.filter(f => {
    const j = joursRestants(f.dateExpiration)
    return j !== null && j >= 0 && j <= PREAVIS_JOURS.value
  }).length)

const formationsAlerte = computed(() => formationsExpirees.value + formationsProches.value)

/**
 * Habilitations obligatoires pour conduire un camion-citerne.
 * APTH et ADR sont exigées par la réglementation malgache du transport
 * d'hydrocarbures ; les deux autres relèvent des cibles du cahier des charges.
 */
const habilitations = computed(() => {
  const a = (motsCles: string[]) =>
    formations.value.find(f => motsCles.some(m => f.titre.toLowerCase().includes(m)))

  const construire = (code: string, libelle: string, motsCles: string[]) => {
    const f = a(motsCles)
    const j = f ? joursRestants(f.dateExpiration) : null
    const perimee = f != null && j !== null && j < 0
    return {
      code, libelle,
      acquise: f != null && !perimee,
      detail: !f ? 'Non suivie - affectation bloquée'
        : perimee ? `Expirée le ${fmtDate(f.dateExpiration)}`
        : f.dateExpiration ? `Valide jusqu’au ${fmtDate(f.dateExpiration)}`
        : `Suivie le ${fmtDate(f.date)}`,
    }
  }

  return [
    construire('ADR',  'Transport de matières dangereuses (ADR/TMD)', ['adr', 'dangereuse', 'tmd']),
    construire('APTH', 'Habilitation APTH - transport d’hydrocarbures', ['apth', 'hydrocarbure']),
    construire('DEF',  'Conduite défensive', ['défensive', 'defensive']),
    construire('ECO',  'Conduite économique', ['économique', 'economique']),
  ]
})

const habilitationsOk = computed(() => habilitations.value.every(h => h.acquise))

const kpisFormations = computed(() => [
  { label: 'Formations suivies', value: String(formations.value.length), cls: 'text-foreground' },
  { label: 'Habilitations acquises', value: `${habilitations.value.filter(h => h.acquise).length}/${habilitations.value.length}`,
    cls: habilitationsOk.value ? 'text-success' : 'text-danger' },
  { label: 'À renouveler', value: String(formationsProches.value), cls: formationsProches.value ? 'text-warning' : 'text-foreground' },
  { label: 'Expirées',     value: String(formationsExpirees.value), cls: formationsExpirees.value ? 'text-danger' : 'text-foreground' },
])

/* ═══════════════════════════════════════════════════════════════
   ONGLET PLANNING
   Croise trois sources : les voyages affectés, les absences du module
   Administration, et les échéances documentaires.
   ═══════════════════════════════════════════════════════════════ */
const voyagesConducteur = computed(() =>
  [...voyagesStore.voyages]
    .filter(v => v.chauffeurId === chauffeurId.value)
    .sort((a, b) => +new Date(b.datePlanifiee) - +new Date(a.datePlanifiee)))

const LIB_STATUT_VOYAGE: Record<string, string> = {
  planifie: 'Planifié', affecte: 'Affecté', en_cours: 'En cours', livre: 'Livré',
  cloture: 'Clôturé', litige: 'En litige', annule: 'Annulé',
}
const CLS_STATUT_VOYAGE: Record<string, string> = {
  planifie: 'bg-gray-100 text-gray-600',  affecte: 'bg-primary/10 text-primary',
  en_cours: 'bg-info-bg text-info',       livre: 'bg-success-bg text-success',
  cloture:  'bg-gray-100 text-gray-500',  litige: 'bg-danger-bg text-danger',
  annule:   'bg-gray-100 text-gray-400',
}

/**
 * Absences du conducteur. Rapprochées par `employeeId` — la clé stable
 * (emp-0xx) — plutôt que par le nom : deux employés homonymes dans des
 * services différents (ex. deux « Nadia Oozeer ») rendraient un
 * rapprochement par nom ambigu, alors que l'ID ne l'est jamais.
 */
const absencesConducteur = computed<LeaveRequest[]>(() =>
  absencesStore.allLeaves.filter((l: LeaveRequest) => l.employeeId === chauffeurId.value))

const voyagesAVenir = computed(() =>
  voyagesConducteur.value.filter(v => v.statut === 'planifie' || v.statut === 'affecte').length)

/**
 * Peut-il partir demain ? Trois conditions cumulatives :
 * documents à jour, habilitations acquises, aucune absence en cours.
 */
const disponibilite = computed(() => {
  const motifs: string[] = []
  if (docsExpires.value) motifs.push(`${docsExpires.value} document(s) expiré(s)`)
  if (!habilitationsOk.value) {
    const manquantes = habilitations.value.filter(h => !h.acquise).map(h => h.code)
    motifs.push(`habilitation(s) manquante(s) : ${manquantes.join(', ')}`)
  }
  const aujourdhui = new Date().toISOString().slice(0, 10)
  const enCours = absencesConducteur.value.find((a: LeaveRequest) => a.startDate <= aujourdhui && a.endDate >= aujourdhui)
  if (enCours) motifs.push(`absence en cours jusqu’au ${fmtDate(enCours.endDate)}`)

  return {
    ok: motifs.length === 0,
    titre: motifs.length === 0
      ? 'Disponible - le conducteur peut être affecté à un voyage'
      : 'Indisponible - affectation bloquée',
    motifs,
  }
})

const kpisPlanning = computed(() => [
  { label: 'Voyages effectués', value: String(voyagesConducteur.value.filter(v => v.statut === 'cloture' || v.statut === 'livre').length), cls: 'text-foreground' },
  { label: 'À venir',           value: String(voyagesAVenir.value), cls: 'text-primary' },
  { label: 'Absences',          value: String(absencesConducteur.value.length), cls: 'text-foreground' },
  { label: 'Disponibilité',     value: disponibilite.value.ok ? 'Oui' : 'Non',
    cls: disponibilite.value.ok ? 'text-success' : 'text-danger' },
])

const ecarts    = computed(() => ecartsStore.ecartsDuChauffeur(chauffeurId.value))
const recharges = computed(() => carburantStore.rechargesDuChauffeur(chauffeurId.value))

function couleurScore(n: number) {
  if (n >= 90) return 'text-success'
  if (n >= 80) return 'text-primary'
  if (n >= 70) return 'text-warning'
  return 'text-danger'
}

function estProche(iso?: string, jours = 30) {
  if (!iso) return false
  return +new Date(iso) <= Date.now() + jours * 86_400_000
}

const echeances = computed(() => {
  const out: { type: string; date: string; expire: boolean }[] = []
  const s = score.value
  if (!s) return out
  const push = (type: string, d?: string) => {
    if (d && estProche(d)) out.push({ type, date: d, expire: +new Date(d) < Date.now() })
  }
  push('Permis de conduire', s.permisExpireLe)
  push('Visite médicale', s.visiteMedicaleExpireLe)
  return out
})

</script>
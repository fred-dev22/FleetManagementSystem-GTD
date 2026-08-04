<template>
  <CardModalShell
    page-title="Dossier de voyage"
    :page-number="item.reference"
    banner-label="Flotte · Voyages"
    :sidebar-items="sidebarItems"
    :current-no="item.id"
    :has-prev="indexCourant > 0"
    :has-next="indexCourant < voyagesOrdonnes.length - 1"
    :is-edit-mode="false"
    :show-edit="false"
    :status-label="STATUT[item.statut].label"
    @close="emit('close')"
    @go-prev="naviguer(-1)"
    @go-next="naviguer(1)"
    @select-sidebar="id => emit('navigate', id)"
  >
    <!-- Badges d'en-tête -->
    <template #title-badges>
      <span :class="STATUT[item.statut].cls" class="px-2.5 py-0.5 rounded-full text-xs font-medium">
        {{ STATUT[item.statut].label }}
      </span>
      <span v-if="coulage.verdict.startsWith('hors')"
        class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-bg text-danger">
        Écart {{ coulage.ecartPourMille }} ‰
      </span>
      <span v-if="sitesManques"
        class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-bg text-warning">
        {{ sitesManques }} site(s) manqué(s)
      </span>
    </template>

    <template #form>
      <div class="flex-1 overflow-y-auto px-8 py-6 max-w-3xl mx-auto">

        <!-- ═══════════════════════════════════════════════════
             1. IDENTIFICATION - d'où vient l'ordre de transport
             Source : fichier « Gestion Opération » de GTD
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Identification"
          :recaps="[item.reference, item.numeroOT, item.clientNom]"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Référence du voyage</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.reference }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">N° d’ordre de transfert</label>
              <span class="text-sm font-mono text-gray-600">{{ item.numeroOT ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Client donneur d’ordre</label>
              <span class="text-sm text-foreground">{{ item.clientNom }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Tolérance de coulage</label>
              <span class="text-sm text-foreground">{{ item.toleranceCoulagePourMille }} ‰</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Produit transporté</label>
              <span class="text-sm text-foreground">{{ item.volumes.produit }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Densité à 15 °C</label>
              <span class="text-sm text-foreground">{{ item.volumes.densite ?? '-' }}</span>
            </div>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             2. AFFECTATION - qui roule, avec quoi
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Affectation"
          :recaps="[item.vehiculePlaque, item.chauffeurNom]"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Tracteur</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.vehiculePlaque ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Citerne attelée</label>
              <span class="text-sm font-mono text-foreground">{{ item.citernePlaque ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">
                Chauffeur <span :class="F.fieldOptional">- déduit de l’affectation</span>
              </label>
              <span class="text-sm text-foreground">{{ item.chauffeurNom ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Départ prévu</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.datePlanifiee) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Départ réel</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.dateDepartReel) }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Arrivée réelle</label>
              <span class="text-sm text-foreground">{{ fmtDateTime(item.dateArriveeReelle) }}</span>
            </div>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             3. PLAN DE TRAJET - la liste des sites affectés
             Source : feuille « plan de trajet » du classeur registres
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Plan de trajet"
          :recaps="[item.trajetLibelle ?? 'Trajet ponctuel', `${item.etapes.length} sites`, `${item.kmReference} km`]"
        >
          <div class="grid grid-cols-3 gap-x-6 gap-y-4 mb-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Trajet de référence</label>
              <span class="text-sm text-foreground">{{ item.trajetLibelle ?? 'Composé pour ce voyage' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Sites affectés</label>
              <span class="text-sm text-foreground">{{ item.etapes.length }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage de référence</label>
              <span class="text-sm text-foreground">{{ item.kmReference }} km</span>
            </div>
          </div>

          <FleetMap
            :trace-prevu="item.etapes.map(e => ({ lat: e.lat, lng: e.lng }))"
            :trace-reel="item.traceReel ?? []"
            :markers="marqueursEtapes"
            :arrets="arretsCarte"
            height="300px"
          />

          <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            Le camion quitte sa base et dessert les sites qui lui ont été affectés, dans l’ordre.
            Le tracé bleu relie les sites prévus, le tracé rouge est le trajet réellement enregistré
            par la télématique. Il n’est pas calculé par le système : seule la séquence de sites fait foi.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             4. DÉROULÉ SITE PAR SITE - le cœur du dossier
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Déroulé site par site"
          :recaps="[`${avancement.faits}/${avancement.total} desservis`, sitesManques ? `${sitesManques} manqué(s)` : 'complet']"
        >
          <div class="flex items-center gap-2 mb-3">
            <div class="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full rounded-full"
                :class="avancement.pct === 100 ? 'bg-success' : 'bg-primary'"
                :style="{ width: avancement.pct + '%' }" />
            </div>
            <span class="text-xs font-semibold">{{ avancement.pct }} %</span>
          </div>

          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">#</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Site</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Rôle</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Arrivée</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Volume</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">État</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in item.etapes" :key="e.id" class="border-b border-border/60">
                <td class="py-2 text-xs font-mono">{{ e.ordre }}</td>
                <td class="py-2">
                  <span class="text-xs font-medium text-foreground">{{ e.siteNom }}</span>
                  <div v-if="e.observation" class="text-[11px] text-danger leading-snug">{{ e.observation }}</div>
                </td>
                <td class="py-2">
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full" :class="CLS_ROLE[e.role]">
                    {{ LIB_ROLE_ETAPE[e.role] }}
                  </span>
                </td>
                <td class="py-2 text-xs">{{ e.heureArrivee ? fmtHeure(e.heureArrivee) : '-' }}</td>
                <td class="py-2">
                  <span v-if="e.volume15L" class="text-xs font-semibold text-primary">{{ fmtL(e.volume15L) }}</span>
                  <span v-else-if="e.volumePrevuL" class="text-xs text-muted-foreground">{{ fmtL(e.volumePrevuL) }} prévu</span>
                  <span v-else class="text-gray-300">-</span>
                </td>
                <td class="py-2">
                  <span v-if="e.franchi" class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Desservi</span>
                  <span v-else class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">Manqué</span>
                </td>
              </tr>
            </tbody>
          </table>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             5. VOLUMÉTRIE ET COULAGE
             Source : « Gestion Opération » - ATA, A15°, tolérances
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Volumétrie & coulage"
          :recaps="[coulage.ecartPourMille != null ? `${coulage.ecartPourMille} ‰` : 'incomplet', VERDICT[coulage.verdict].label]"
        >
          <div class="grid grid-cols-4 gap-3 mb-4 max-sm:grid-cols-2">
            <div>
              <label :class="F.fieldLabel">Chargé à 15 °C</label>
              <p class="text-lg font-bold text-foreground">{{ coulage.chargeL ? fmtL(coulage.chargeL) : '-' }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Livré, tous sites</label>
              <p class="text-lg font-bold text-foreground">{{ coulage.livreL ? fmtL(coulage.livreL) : '-' }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Écart consolidé</label>
              <p class="text-lg font-bold" :class="VERDICT[coulage.verdict].text">
                {{ coulage.ecartPourMille != null ? coulage.ecartPourMille + ' ‰' : '-' }}
              </p>
            </div>
            <div>
              <label :class="F.fieldLabel">Prévu non livré</label>
              <p class="text-lg font-bold" :class="coulage.nonLivreL ? 'text-danger' : 'text-foreground'">
                {{ coulage.nonLivreL ? fmtL(coulage.nonLivreL) : '0 L' }}
              </p>
            </div>
          </div>

          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Site livré</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Prévu</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Mesuré</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">À 15 °C</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Écart</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="st in coulage.sites" :key="st.etapeId" class="border-b border-border/60">
                <td class="py-2 text-xs font-medium">{{ st.ordre }}. {{ st.siteNom }}</td>
                <td class="py-2 text-xs">{{ st.prevuL ? fmtL(st.prevuL) : '-' }}</td>
                <td class="py-2 text-xs">
                  <template v-if="st.ambiantL">
                    {{ fmtL(st.ambiantL) }}
                    <span class="text-[10px] text-muted-foreground">à {{ st.temperatureC }} °C</span>
                  </template>
                  <span v-else class="text-gray-300">-</span>
                </td>
                <td class="py-2 text-xs font-semibold text-primary">{{ st.volume15L ? fmtL(st.volume15L) : '-' }}</td>
                <td class="py-2 text-xs">
                  <span v-if="st.ecartSiteL != null"
                    :class="Math.abs(st.ecartSiteL) > 200 ? 'text-danger font-medium' : 'text-muted-foreground'">
                    {{ st.ecartSiteL > 0 ? '+' : '' }}{{ st.ecartSiteL }} L
                  </span>
                  <span v-else class="text-gray-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Curseur de tolérance client -->
          <div v-if="coulage.ecartPourMille != null" class="mt-4">
            <div class="relative h-7">
              <div class="absolute inset-x-0 top-3 h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
                <div class="h-full bg-success" :style="{ width: pctBarre + '%' }" />
                <div class="h-full bg-warning" :style="{ width: pctBarre + '%' }" />
                <div class="h-full bg-danger flex-1" />
              </div>
              <div class="absolute top-1 w-1 h-5 rounded-full bg-foreground shadow"
                :style="{ left: `calc(${curseur}% - 2px)` }" />
            </div>
            <div class="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>0 ‰</span>
              <span>{{ coulage.tolerance }} ‰ - tolérance {{ item.clientNom }}</span>
              <span>{{ (coulage.tolerance * 3).toFixed(1) }} ‰</span>
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">
            Le volume à 15 °C est calculé par le système à partir du volume mesuré, de la température
            et de la densité - jamais ressaisi. C’est la première source d’erreur et de contestation
            avec les distributeurs.
          </p>

          <!-- Projet de note de protêt, pré-rempli dès dépassement -->
          <div v-if="coulage.verdict.startsWith('hors')" class="mt-4">
            <div class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mb-2.5">
              <FileWarning class="w-4 h-4 shrink-0 mt-px" />
              <p class="text-xs leading-relaxed">
                Écart consolidé de <strong>{{ coulage.ecartPourMille }} ‰</strong> pour une tolérance
                {{ item.clientNom }} de {{ coulage.tolerance }} ‰. Le projet de note de protêt ci-dessous
                est pré-rempli à partir du dossier de tournée.
              </p>
            </div>
            <div class="bg-background rounded-md px-3.5 py-3 text-[11px] leading-relaxed font-mono whitespace-pre-line">{{ projetNoteProtet }}</div>
            <button class="mt-2.5 py-1.5 px-3 rounded-lg text-[12px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-0 cursor-pointer">
              Générer et transmettre
            </button>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             TEMPS RÉGLEMENTAIRES - évalués sur le déroulé réel
             Les seuils viennent de la page Configuration.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Temps réglementaires"
          :recaps="[temps.conforme ? 'conformes' : `${temps.depassements.length} dépassement(s)`,
                    fmtDuree(temps.conduiteTotaleMin)]"
        >
          <div class="grid grid-cols-4 gap-3 mb-4 max-sm:grid-cols-2">
            <div>
              <label :class="F.fieldLabel">Conduite totale</label>
              <p class="text-lg font-bold"
                :class="temps.conduiteTotaleMin > params.tcjMaxMin ? 'text-danger' : 'text-foreground'">
                {{ fmtDuree(temps.conduiteTotaleMin) }}
              </p>
              <p class="text-[10px] text-muted-foreground">seuil {{ fmtDuree(params.tcjMaxMin) }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Conduite continue max</label>
              <p class="text-lg font-bold"
                :class="temps.conduiteContinueMaxMin > params.tccMaxMin ? 'text-danger' : 'text-foreground'">
                {{ fmtDuree(temps.conduiteContinueMaxMin) }}
              </p>
              <p class="text-[10px] text-muted-foreground">seuil {{ fmtDuree(params.tccMaxMin) }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Pauses cumulées</label>
              <p class="text-lg font-bold text-foreground">{{ fmtDuree(temps.pausesTotalesMin) }}</p>
              <p class="text-[10px] text-muted-foreground">2 × 30 min + 1 h attendus</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Travail journalier</label>
              <p class="text-lg font-bold"
                :class="temps.travailTotalMin > params.ttjMaxMin ? 'text-danger' : 'text-foreground'">
                {{ fmtDuree(temps.travailTotalMin) }}
              </p>
              <p class="text-[10px] text-muted-foreground">seuil {{ fmtDuree(params.ttjMaxMin) }}</p>
            </div>
          </div>

          <div v-if="temps.conforme" class="flex items-center gap-2 text-xs text-success">
            <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
            Aucun dépassement relevé sur cette tournée.
          </div>

          <div v-else class="flex flex-col gap-1.5">
            <div v-for="(d, i) in temps.depassements" :key="i"
              class="flex items-start gap-2.5 rounded-md px-3 py-2"
              :class="d.gravite === 'critique' ? 'bg-danger-bg' : 'bg-warning-bg'">
              <AlertTriangle class="w-3.5 h-3.5 shrink-0 mt-0.5"
                :class="d.gravite === 'critique' ? 'text-danger' : 'text-warning'" />
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium"
                  :class="d.gravite === 'critique' ? 'text-danger' : 'text-warning'">{{ d.libelle }}</p>
                <p class="text-[11px] text-muted-foreground">
                  {{ fmtDuree(d.valeurMin) }} relevées pour un seuil de {{ fmtDuree(d.seuilMin) }} -
                  dépassement de {{ fmtDuree(d.depassementMin) }}<span v-if="d.siteNom"> · atteint à {{ d.siteNom }}</span>
                </p>
              </div>
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Évalué automatiquement à partir des heures d’arrivée et de départ relevées sur chaque site.
            Les seuils sont modifiables dans Configuration → Paramètres.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             6. CONFORMITÉ - écarts et arrêts
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Conformité"
          :recaps="[`${ecarts.length} écart(s)`, `${arrets.filter(a => !a.justifie && !a.dansSiteDeclare).length} arrêt(s) non justifié(s)`]"
        >
          <div v-if="!ecarts.length && !arrets.length" class="text-xs text-muted-foreground py-2">
            Aucun écart ni arrêt relevé sur ce voyage.
          </div>

          <template v-if="ecarts.length">
            <p class="text-[11px] font-semibold text-foreground mb-1.5">Écarts détectés</p>
            <div v-for="e in ecarts" :key="e.id"
              class="flex items-start gap-2.5 rounded-md border border-border px-3 py-2 mb-1.5">
              <AlertTriangle class="w-3.5 h-3.5 shrink-0 mt-0.5"
                :class="e.gravite === 'critique' ? 'text-danger' : 'text-warning'" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground">{{ LIB_TYPE_ECART[e.type] }}</p>
                <p class="text-[11px] text-muted-foreground">
                  {{ e.lieu ?? '' }} · {{ fmtDateTime(e.detecteLe) }} · {{ fmtDuree(e.dureeMin) }}
                </p>
              </div>
              <span :class="LIB_NATURE[e.nature].cls" class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0">
                {{ LIB_NATURE[e.nature].label }}
              </span>
            </div>
          </template>

          <template v-if="arrets.length">
            <p class="text-[11px] font-semibold text-foreground mb-1.5 mt-3">Arrêts relevés</p>
            <div v-for="a in arrets" :key="a.id"
              class="flex items-start gap-2.5 rounded-md border border-border px-3 py-2 mb-1.5">
              <Octagon class="w-3.5 h-3.5 shrink-0 mt-0.5"
                :class="a.dansSiteDeclare || a.justifie ? 'text-success' : 'text-danger'" />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-foreground">{{ a.lieu ?? 'Arrêt' }} - {{ fmtDuree(a.dureeMin) }}</p>
                <p class="text-[11px] text-muted-foreground">{{ a.motif ?? 'Aucun motif renseigné' }}</p>
              </div>
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                :class="a.dansSiteDeclare ? 'bg-gray-100 text-gray-600'
                      : a.justifie ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'">
                {{ a.dansSiteDeclare ? 'Site déclaré' : a.justifie ? 'Justifié' : 'Non justifié' }}
              </span>
            </div>
          </template>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             7. DOSSIER DOCUMENTAIRE
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Dossier documentaire"
          :recaps="[`${dossier.presents}/${dossier.total} pièces`, dossier.complet ? 'complet' : 'incomplet']"
        >
          <div class="flex items-center gap-2 mb-3">
            <div class="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full rounded-full" :class="dossier.complet ? 'bg-success' : 'bg-warning'"
                :style="{ width: dossier.pct + '%' }" />
            </div>
            <span class="text-xs font-semibold">{{ dossier.presents }}/{{ dossier.total }}</span>
          </div>

          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Pièce</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">N°</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Émetteur</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">État</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in documents" :key="d.id" class="border-b border-border/60">
                <td class="py-2 text-xs font-medium">{{ LIB_DOC[d.type] }}</td>
                <td class="py-2 text-xs font-mono">{{ d.numero ?? '-' }}</td>
                <td class="py-2 text-xs text-muted-foreground">{{ d.emetteur ?? '-' }}</td>
                <td class="py-2">
                  <span v-if="d.present" class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Présent</span>
                  <span v-else class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">Manquant</span>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-if="!dossier.complet" class="text-[11px] text-warning mt-2">
            Manquant : {{ dossier.manquants.map(m => LIB_DOC[m]).join(', ') }}. La clôture du voyage est bloquée.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             8. CARBURANT DU CAMION
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Carburant du camion"
          :recaps="[`${recharges.length} recharge(s)`, fmtL(litresVoyage)]"
          :default-open="false"
        >
          <div v-if="!recharges.length" class="text-xs text-muted-foreground py-2">
            Aucune recharge rattachée à ce voyage.
          </div>
          <table v-else class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Date</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Lieu</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Bons</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Litres</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Contrôles</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in recharges" :key="r.id" class="border-b border-border/60">
                <td class="py-2 text-xs">{{ fmtDateTime(r.date) }}</td>
                <td class="py-2 text-xs">{{ r.lieu }}</td>
                <td class="py-2 text-xs font-semibold">{{ r.nombreBons ?? '-' }}</td>
                <td class="py-2 text-xs">{{ fmtL(r.litres) }}</td>
                <td class="py-2">
                  <span v-if="r.statut === 'valide'" class="text-[10px] px-2 py-0.5 rounded-full bg-success-bg text-success">Conforme</span>
                  <span v-else class="text-[10px] px-2 py-0.5 rounded-full bg-danger-bg text-danger">
                    {{ r.controles.filter(c => !c.ok).length }} anomalie(s)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             9. DÉBRIEFING - reprise de la fiche papier de GTD
             ═══════════════════════════════════════════════════ -->
        <!-- ═══════════════════════════════════════════════════
             8b. ALERTE SIPHONNAGE - recoupement de trois signaux
             ═══════════════════════════════════════════════════ -->
        <FormSection
          v-if="siphonnage.nbSignaux > 0"
          title="Détection de siphonnage"
          :recaps="[`${siphonnage.nbSignaux}/3 signaux`, siphonnage.prioritaire ? 'ALERTE PRIORITAIRE' : 'sous surveillance']"
          :default-open="siphonnage.prioritaire"
        >
          <div v-if="siphonnage.prioritaire"
            class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mb-3">
            <ShieldAlert class="w-4 h-4 shrink-0 mt-px" />
            <p class="text-xs leading-relaxed">
              <strong>Alerte prioritaire.</strong> Les trois signaux sont réunis sur cette tournée.
              Pris isolément, chacun n’est qu’un indice ; leur concomitance constitue un faisceau
              nettement plus solide. Le dossier ci-dessous est déjà constitué.
            </p>
          </div>

          <ul class="flex flex-col gap-1.5">
            <li v-for="sig in siphonnage.signaux" :key="sig.code"
              class="flex items-start gap-2.5 rounded-md px-3 py-2"
              :class="sig.present ? 'bg-danger-bg' : 'bg-background'">
              <component :is="sig.present ? XCircle : CheckCircle2" class="w-4 h-4 shrink-0 mt-px"
                :class="sig.present ? 'text-danger' : 'text-success'" />
              <div class="min-w-0">
                <p class="text-xs font-medium" :class="sig.present ? 'text-danger' : 'text-foreground'">
                  {{ sig.libelle }}
                </p>
                <p class="text-[11px] text-muted-foreground">{{ sig.detail }}</p>
              </div>
            </li>
          </ul>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             9. DÉBRIEFING AU RETOUR
             Reprise du formulaire papier de GTD - neuf infractions.
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Débriefing au retour"
          :recaps="[`${totalInfractions} infraction(s)`, debriefing ? 'renseigné' : 'à réaliser']"
          :default-open="false"
        >
          <!-- Kilométrage et écart de livraison -->
          <div class="grid grid-cols-3 gap-x-6 gap-y-4 mb-4 max-sm:grid-cols-2">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage départ</label>
              <span class="text-sm text-foreground">{{ item.kmDepart?.toLocaleString('fr-FR') ?? '-' }} km</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage arrivée</label>
              <span class="text-sm text-foreground">{{ item.kmArrivee?.toLocaleString('fr-FR') ?? '-' }} km</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Écart au kilométrage prévu</label>
              <span class="text-sm" :class="km.horsTolerance ? 'text-danger font-medium' : 'text-foreground'">
                {{ km.ecartKm != null ? (km.ecartKm > 0 ? '+' : '') + km.ecartKm + ' km' : '-' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Gain</label>
              <span class="text-sm font-semibold" :class="gain ? 'text-success' : 'text-muted-foreground'">
                {{ gain ? fmtL(gain) : '-' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Coulage</label>
              <span class="text-sm font-semibold" :class="coulageL ? 'text-danger' : 'text-muted-foreground'">
                {{ coulageL ? fmtL(coulageL) : '-' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Taux d’infraction</label>
              <span class="text-sm font-semibold text-foreground">{{ tauxInfraction }} %</span>
            </div>
          </div>

          <!-- Les neuf infractions du formulaire papier -->
          <p class="text-[11px] font-semibold text-foreground mb-1.5">Infractions relevées</p>
          <table class="w-full border-collapse mb-4">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Infraction</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Niveau</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Nombre</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Date</th>
                <th class="text-left py-1.5 text-[11px] font-semibold text-muted-foreground">Explication</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="li in lignesInfractions" :key="li.code" class="border-b border-border/60">
                <td class="py-2 text-xs font-medium">{{ LIB_INFRACTION_DEBRIEF[li.code] }}</td>
                <td class="py-2">
                  <span v-if="li.niveau" class="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    :class="CLS_NIVEAU[li.niveau]">{{ li.niveau }}</span>
                  <span v-else class="text-gray-300">-</span>
                </td>
                <td class="py-2 text-xs" :class="li.nombre ? 'font-semibold text-danger' : 'text-gray-300'">
                  {{ li.nombre || '-' }}
                </td>
                <td class="py-2 text-xs">{{ li.date ? fmtDate(li.date) : '-' }}</td>
                <td class="py-2 text-[11px] text-muted-foreground">{{ li.explication ?? '-' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Respect du plan de trajet -->
          <p class="text-[11px] font-semibold text-foreground mb-1.5">Respect du plan de trajet</p>
          <div class="grid grid-cols-3 gap-2 mb-4 max-sm:grid-cols-1">
            <div v-for="rc in respects" :key="rc.label"
              class="flex items-center gap-2 rounded-md px-3 py-2"
              :class="rc.ok ? 'bg-background' : 'bg-danger-bg'">
              <component :is="rc.ok ? CheckCircle2 : XCircle" class="w-3.5 h-3.5 shrink-0"
                :class="rc.ok ? 'text-success' : 'text-danger'" />
              <span class="text-[11px]" :class="rc.ok ? 'text-foreground' : 'text-danger font-medium'">
                {{ rc.label }}
              </span>
            </div>
          </div>

          <!-- Remontées et actions -->
          <div v-if="debriefing?.remontees" class="flex flex-col gap-1 mb-3">
            <label :class="F.fieldLabel">Remontées d’événements</label>
            <p class="text-sm text-foreground leading-relaxed">{{ debriefing.remontees }}</p>
          </div>

          <template v-if="debriefing?.actions.length">
            <p class="text-[11px] font-semibold text-foreground mb-1.5">Plan d’action</p>
            <ul class="flex flex-col gap-1.5 mb-3">
              <li v-for="a in debriefing.actions" :key="a.id"
                class="flex items-start gap-2.5 rounded-md border border-border px-3 py-2">
                <component :is="a.close ? CheckCircle2 : Octagon" class="w-3.5 h-3.5 shrink-0 mt-px"
                  :class="a.close ? 'text-success' : 'text-warning'" />
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-foreground">{{ a.libelle }}</p>
                  <p class="text-[11px] text-muted-foreground">
                    {{ a.responsable }}<span v-if="a.dateLimite"> · échéance {{ fmtDate(a.dateLimite) }}</span>
                  </p>
                </div>
              </li>
            </ul>
          </template>

          <div v-if="debriefing" class="grid grid-cols-3 gap-x-6 gap-y-3 pt-3 border-t border-border max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Responsable</label>
              <span class="text-xs text-foreground">{{ debriefing.signatureResponsable ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Chauffeur</label>
              <span class="text-xs text-foreground">{{ debriefing.signatureChauffeur ?? '-' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Clôturé le</label>
              <span class="text-xs text-foreground">{{ fmtDate(debriefing.dateCloture) }}</span>
            </div>
          </div>

          <p v-else class="text-[11px] text-warning mt-2">
            Débriefing non encore réalisé pour ce voyage.
          </p>
        </FormSection>

      </div>
    </template>
  </CardModalShell>
</template>

<script setup lang="ts">
/**
 * Fiche « Dossier de voyage ».
 *
 * Même coquille et même langage visuel que la fiche véhicule : CardModalShell
 * + sections repliables FormSection. Chaque section correspond à un document
 * de référence réellement utilisé par GTD.
 */
import { computed } from 'vue'
import { AlertTriangle, Octagon, FileWarning, ShieldAlert, CheckCircle2, XCircle } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import FleetMap       from './FleetMap.vue'
import { useVoyagesStore, LIB_DOC } from '../../stores/voyages'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE } from '../../stores/ecarts'
import { useCarburantStore } from '../../stores/carburant'
import { useConfigurationStore } from '../../stores/configuration'
import { LIB_ROLE_ETAPE, LIB_INFRACTION_DEBRIEF } from '../../types/fms'
import type {
  Voyage, StatutVoyage, RoleEtape, MapMarker, MapArret,
  CodeInfractionDebrief, LigneInfractionDebrief, NiveauInfraction,
} from '../../types/fms'
import type { VerdictCoulage } from '../../lib/fmsUtils'
import {
  calculerCoulageMultiSites, calculerEcartKm, detecterSiphonnage, analyserTempsConduite,
  fmtDate, fmtDateTime, fmtHeure, fmtDuree, fmtL,
} from '../../lib/fmsUtils'
import { useDebriefingsStore } from '../../stores/debriefings'
import * as F from '../../lib/formClasses'

const props = defineProps<{ voyage: Voyage }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store          = useVoyagesStore()
const ecartsStore    = useEcartsStore()
const carburantStore = useCarburantStore()
const debriefingsStore = useDebriefingsStore()

/** Lecture réactive depuis le store, comme le fait la fiche véhicule. */
const item = computed(() => store.getById(props.voyage.id) ?? props.voyage)

/* ── Libellés ─────────────────────────────────────────────── */
const STATUT: Record<StatutVoyage, { label: string; cls: string }> = {
  planifie: { label: 'Planifié',  cls: 'bg-gray-100 text-gray-600'  },
  affecte:  { label: 'Affecté',   cls: 'bg-primary/10 text-primary' },
  en_cours: { label: 'En cours',  cls: 'bg-info-bg text-info'       },
  livre:    { label: 'Livré',     cls: 'bg-success-bg text-success' },
  cloture:  { label: 'Clôturé',   cls: 'bg-gray-100 text-gray-500'  },
  litige:   { label: 'En litige', cls: 'bg-danger-bg text-danger'   },
  annule:   { label: 'Annulé',    cls: 'bg-gray-100 text-gray-400'  },
}

const CLS_ROLE: Record<RoleEtape, string> = {
  depart:     'bg-gray-100 text-gray-600',
  chargement: 'bg-primary/10 text-primary',
  livraison:  'bg-success-bg text-success',
  controle:   'bg-info-bg text-info',
  repos:      'bg-warning-bg text-warning',
  arrivee:    'bg-gray-100 text-gray-600',
}

const VERDICT: Record<VerdictCoulage, { text: string; label: string }> = {
  incomplet:      { text: 'text-gray-400', label: 'Incomplet' },
  dans_tolerance: { text: 'text-success',  label: 'Dans la tolérance' },
  hors_mineur:    { text: 'text-warning',  label: 'Hors tolérance' },
  hors_majeur:    { text: 'text-danger',   label: 'Hors tolérance majeur' },
}

/* ── Données dérivées ─────────────────────────────────────── */
const coulage = computed(() =>
  calculerCoulageMultiSites(item.value.etapes, item.value.toleranceCoulagePourMille, item.value.volumes.densite))

const km = computed(() => calculerEcartKm(item.value, 5))

/* ── Temps réglementaires, évalués sur le déroulé réel ────── */
const configStore = useConfigurationStore()
const params = computed(() => configStore.parametres)

const temps = computed(() => analyserTempsConduite(item.value.etapes, {
  tccMaxMin: params.value.tccMaxMin,
  pauseApresTccMin: params.value.pauseApresTccMin,
  tcjMaxMin: params.value.tcjMaxMin,
  ttjMaxMin: params.value.ttjMaxMin,
}))

/* ── Curseur de tolérance : position de l'écart sur l'échelle 0 → 3× tolérance ── */
const pctBarre = computed(() => 100 / 3)

const curseur = computed(() => {
  const c = coulage.value
  if (c.ecartPourMille == null) return 0
  return Math.min(100, Math.max(0, (Math.abs(c.ecartPourMille) / (c.tolerance * 3)) * 100))
})

/* ── Projet de note de protêt, dérivé du dossier ── */
const projetNoteProtet = computed(() => {
  const v = item.value
  const c = coulage.value
  const manques = v.etapes.filter(e => !e.franchi).map(e => e.siteNom)
  return `NOTE DE PROTÊT - projet généré automatiquement
Voyage        : ${v.reference}
Ordre GRT     : ${v.numeroOT ?? '-'}
Client        : ${v.clientNom}
Véhicule      : ${v.vehiculePlaque ?? '-'} / citerne ${v.citernePlaque ?? '-'}
Chauffeur     : ${v.chauffeurNom ?? '-'}
Produit       : ${v.volumes.produit}

Volume chargé (15 °C)   : ${c.chargeL?.toLocaleString('fr-FR') ?? '-'} L
Volume livré (15 °C)    : ${c.livreL?.toLocaleString('fr-FR') ?? '-'} L
Écart constaté          : ${c.ecartL?.toLocaleString('fr-FR') ?? '-'} L (${c.ecartPourMille} ‰)
Tolérance contractuelle : ${c.tolerance} ‰

Sites desservis : ${v.etapes.filter(e => e.role === 'livraison' && e.franchi).length} / ${v.etapes.filter(e => e.role === 'livraison').length}
${manques.length ? `Points non franchis : ${manques.join(', ')}` : 'Tous les points de passage ont été franchis.'}

Motif présumé : ${v.nbArretsNonJustifies > 0
    ? 'écart de livraison hors tolérance, concomitant à un arrêt non planifié hors point autorisé'
    : 'écart de livraison hors tolérance'}`
})

const avancement = computed(() => {
  const e = item.value.etapes
  const faits = e.filter(x => x.franchi).length
  return { faits, total: e.length, pct: e.length ? Math.round((faits / e.length) * 100) : 0 }
})

const sitesManques = computed(() => item.value.etapes.filter(e => !e.franchi).length)

const ecarts    = computed(() => ecartsStore.ecartsDuVoyage(item.value.id))
const arrets    = computed(() => store.arretsDuVoyage(item.value.id))
const documents = computed(() => store.documentsDuVoyage(item.value.id))
const dossier   = computed(() => store.completudeDossier(item.value.id))

const recharges = computed(() =>
  carburantStore.recharges.filter(r => r.voyageId === item.value.id))

const litresVoyage = computed(() => recharges.value.reduce((s, r) => s + r.litres, 0))

/* ── Cartographie ─────────────────────────────────────────── */
const marqueursEtapes = computed<MapMarker[]>(() =>
  item.value.etapes.map(e => ({
    id: e.id, lat: e.lat, lng: e.lng,
    label: `${e.ordre}. ${e.siteNom}`,
    sublabel: `${LIB_ROLE_ETAPE[e.role]} - ${e.franchi ? 'desservi' : 'manqué'}`,
    color: e.franchi ? '#16a34a' : '#dc2626',
  })))

const arretsCarte = computed<MapArret[]>(() =>
  arrets.value.filter(a => !a.dansSiteDeclare).map(a => ({
    id: a.id, lat: a.lat, lng: a.lng,
    label: a.lieu ?? 'Arrêt', dureeMin: a.dureeMin, justifie: a.justifie,
  })))

/* ══ Détection de siphonnage - recoupement de trois signaux ══ */
const siphonnage = computed(() => {
  const arretsNJ = arrets.value.filter(a => !a.dansSiteDeclare && !a.justifie)
  const conso = carburantStore.periodesConso.find(p => p.vehiculePlaque === item.value.vehiculePlaque)
  return detecterSiphonnage({
    voyageId: item.value.id,
    voyageRef: item.value.reference,
    vehiculePlaque: item.value.vehiculePlaque,
    chauffeurNom: item.value.chauffeurNom,
    arretsNonJustifies: arretsNJ.length,
    dureeArretMaxMin: arretsNJ.length ? Math.max(...arretsNJ.map(a => a.dureeMin)) : undefined,
    ecartConsoPct: conso?.ecartPct ?? null,
    ecartPourMille: coulage.value.ecartPourMille,
    toleranceCoulage: item.value.toleranceCoulagePourMille,
  })
})

/* ══ Débriefing au retour ══ */
const debriefing = computed(() => debriefingsStore.getByVoyage(item.value.id))

const CLS_NIVEAU: Record<NiveauInfraction, string> = {
  leger: 'bg-gray-100 text-gray-600',
  moyen: 'bg-warning-bg text-warning',
  grave: 'bg-danger-bg text-danger',
}

/** Les neuf lignes du formulaire papier, renseignées ou non. */
const lignesInfractions = computed<LigneInfractionDebrief[]>(() => {
  const codes = Object.keys(LIB_INFRACTION_DEBRIEF) as CodeInfractionDebrief[]
  return codes.map(code =>
    debriefing.value?.infractions.find(i => i.code === code) ?? { code, nombre: 0 })
})

const totalInfractions = computed(() =>
  lignesInfractions.value.reduce((s, l) => s + l.nombre, 0))

const tauxInfraction = computed(() => {
  const n = item.value.etapes.length || 1
  return Number(((totalInfractions.value / n) * 100).toFixed(1))
})

const gain = computed(() =>
  coulage.value.ecartL != null && coulage.value.ecartL < 0 ? Math.abs(coulage.value.ecartL) : 0)

const coulageL = computed(() =>
  coulage.value.ecartL != null && coulage.value.ecartL > 0 ? coulage.value.ecartL : 0)

const respects = computed(() => [
  { label: 'Plan de trajet respecté', ok: debriefing.value?.planTrajetRespecte ?? item.value.etapes.every(e => e.franchi) },
  { label: 'Arrêts autorisés respectés', ok: debriefing.value?.arretsRespectes ?? item.value.nbArretsNonJustifies === 0 },
  { label: 'Repos autorisés respectés', ok: debriefing.value?.reposRespectes ?? true },
])

/* ── Navigation d'un voyage à l'autre, comme la fiche véhicule ── */
const voyagesOrdonnes = computed(() =>
  [...store.voyages].sort((a, b) => b.reference.localeCompare(a.reference)))

const indexCourant = computed(() =>
  voyagesOrdonnes.value.findIndex(v => v.id === item.value.id))

const sidebarItems = computed(() =>
  voyagesOrdonnes.value.map(v => ({ no: v.id, label: v.reference })))

function naviguer(delta: number) {
  const cible = voyagesOrdonnes.value[indexCourant.value + delta]
  if (cible) emit('navigate', cible.id)
}
</script>

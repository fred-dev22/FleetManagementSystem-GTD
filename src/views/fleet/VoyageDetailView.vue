<template>
  <div :class="L.pagePadding">
    <div v-if="!voyage" :class="L.emptyState">
      <Package class="w-8 h-8" />
      <p class="text-sm">Voyage introuvable</p>
    </div>

    <template v-else>
      <!-- ── En-tête ──────────────────────────────────────────── -->
      <div :class="L.pageHeader">
        <div class="flex items-start gap-3">
          <button :class="L.tbIconBtn" @click="router.back()"><ArrowLeft class="w-4 h-4" /></button>
          <div>
            <div class="flex items-center gap-2">
              <h1 :class="L.pageTitle" class="font-mono">{{ voyage.reference }}</h1>
              <span :class="STATUT[voyage.statut].cls" class="text-xs font-medium px-2 py-0.5 rounded-full">
                {{ STATUT[voyage.statut].label }}
              </span>
            </div>
            <p :class="L.pageSub">
              {{ voyage.origine }} → {{ voyage.destination }} · {{ voyage.clientNom }}
              <span v-if="voyage.numeroOT"> · OT {{ voyage.numeroOT }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="voyage.statut === 'livre'" :class="L.btnPrimary" @click="tenterCloture">
            <CheckCircle2 class="w-4 h-4" /> Clôturer le voyage
          </button>
        </div>
      </div>

      <div v-if="msgCloture" :class="F.fieldErrorBlock" class="mb-3.5">
        <AlertCircle class="w-3.5 h-3.5" /> {{ msgCloture }}
      </div>

      <!-- ── Onglets ──────────────────────────────────────────── -->
      <div class="flex gap-1 border-b border-border mb-3.5 overflow-x-auto">
        <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
          class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer bg-transparent"
          :class="tab === t.key
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'">
          {{ t.label }}
          <span v-if="t.badge" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-bg text-danger">{{ t.badge }}</span>
        </button>
      </div>

      <!-- ══ SYNTHÈSE ═══════════════════════════════════════════ -->
      <div v-if="tab === 'synthese'" class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3.5 items-start">
        <div class="flex flex-col gap-3.5">
          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><MapIcon class="w-4 h-4 text-primary" /> Itinéraire</h2>
              <span class="text-[11px] text-muted-foreground">{{ voyage.trajetLibelle ?? "Trajet ponctuel" }} · {{ voyage.etapes.length }} sites</span>
            </div>
            <FleetMap
              :trace-prevu="voyage.etapes.map(e => ({ lat: e.lat, lng: e.lng }))"
              :trace-reel="voyage.traceReel ?? []"
              :markers="marqueursEtapes"
              :points-passage="zonesEtapes"
              :arrets="arretsCarte"
              :couloir-m="0"
              height="380px"
            />
          </div>

          <!-- ═══ Conformité aux points de passage ═══ -->
          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><MapPinned class="w-4 h-4 text-primary" /> Points de passage</h2>
              <span class="text-xs" :class="conformite.nbFranchis === conformite.nbTotal ? 'text-success' : 'text-warning'">
                {{ conformite.nbFranchis }}/{{ conformite.nbTotal }} franchis · {{ conformite.tauxConformite }} %
              </span>
            </div>

            <p class="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">
              Un site est réputé franchi si la trace télématique passe à moins de 5 km de sa position.
              L’écart se mesure sur cette séquence, pas sur un tracé théorique.
            </p>

            <table :class="L.table">
              <thead><tr>
                <th :class="L.th" class="cursor-default">#</th>
                <th :class="L.th" class="cursor-default">Site</th>
                <th :class="L.th" class="cursor-default">Rôle</th>
                <th :class="L.th" class="cursor-default">Approche</th>
                <th :class="L.th" class="cursor-default">État</th>
              </tr></thead>
              <tbody>
                <tr v-for="pt in conformite.points" :key="pt.id" :class="L.rowHover">
                  <td :class="L.td"><span class="font-mono text-xs">{{ pt.ordre }}</span></td>
                  <td :class="L.td"><span class="text-xs font-medium">{{ pt.siteNom }}</span></td>
                  <td :class="L.td"><span class="text-xs text-muted-foreground">{{ LIB_ROLE_ETAPE[pt.role as RoleEtape] }}</span></td>
                  <td :class="L.td">
                    <span class="text-xs" :class="pt.franchi ? 'text-foreground' : 'text-danger font-medium'">
                      {{ Number.isFinite(pt.distanceMinKm) ? pt.distanceMinKm + ' km' : '—' }}
                    </span>
                  </td>
                  <td :class="L.td">
                    <span v-if="pt.franchi" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Franchi</span>
                    <span v-else class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">Non franchi</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="conformite.manques.length || conformite.horsSequence"
              class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mt-2.5">
              <AlertCircle class="w-4 h-4 shrink-0 mt-px" />
              <p class="text-xs leading-relaxed">
                <span v-if="conformite.manques.length">
                  Point(s) non franchi(s) : <strong>{{ conformite.manques.join(', ') }}</strong>.
                </span>
                <span v-if="conformite.horsSequence"> Séquence non respectée : des sites ont été desservis dans le désordre.</span>
                Écart latéral maximal relevé : <strong>{{ (conformite.ecartLateralMaxM / 1000).toFixed(1) }} km</strong>.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div v-for="m in mesures" :key="m.label" class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p class="text-xl font-bold leading-none" :class="m.cls">{{ m.value }}</p>
              <p class="text-[11px] text-gray-500 mt-1">{{ m.label }}</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3.5">
          <div :class="L.card">
            <div :class="L.cardHeader"><h2 :class="L.cardTitle">Affectation</h2></div>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
              <div><dt class="text-muted-foreground text-[11px]">Tracteur</dt><dd class="font-mono">{{ voyage.vehiculePlaque ?? '—' }}</dd></div>
              <div><dt class="text-muted-foreground text-[11px]">Citerne</dt><dd class="font-mono">{{ voyage.citernePlaque ?? '—' }}</dd></div>
              <div class="col-span-2"><dt class="text-muted-foreground text-[11px]">Chauffeur</dt>
                <dd><button class="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                  @click="voyage.chauffeurId && router.push({ name: 'fleet-conducteur-detail', params: { id: voyage.chauffeurId } })">
                  {{ voyage.chauffeurNom ?? '—' }}</button></dd></div>
              <div><dt class="text-muted-foreground text-[11px]">Départ prévu</dt><dd>{{ fmtDateTime(voyage.datePlanifiee) }}</dd></div>
              <div><dt class="text-muted-foreground text-[11px]">Départ réel</dt><dd>{{ fmtDateTime(voyage.dateDepartReel) }}</dd></div>
              <div><dt class="text-muted-foreground text-[11px]">Produit</dt><dd>{{ voyage.volumes.produit }}</dd></div>
              <div><dt class="text-muted-foreground text-[11px]">Tolérance</dt><dd>{{ voyage.toleranceCoulagePourMille }} ‰</dd></div>
            </dl>
          </div>

          <div :class="L.card">
            <div :class="L.cardHeader">
              <h2 :class="L.cardTitle"><FolderCheck class="w-4 h-4 text-primary" /> Dossier documentaire</h2>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <div class="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div class="h-full rounded-full" :class="dossier.complet ? 'bg-success' : 'bg-warning'"
                  :style="{ width: dossier.pct + '%' }" />
              </div>
              <span class="text-xs font-medium">{{ dossier.presents }}/{{ dossier.total }}</span>
            </div>
            <p v-if="!dossier.complet" class="text-[11px] text-warning">
              Manquant : {{ dossier.manquants.map(m => LIB_DOC[m]).join(', ') }}
            </p>
            <p v-else class="text-[11px] text-success">Dossier complet — clôture possible.</p>
          </div>
        </div>
      </div>

      <!-- ══ SITES & LIVRAISONS ═════════════════════════════════ -->
    <div v-else-if="tab === 'sites'" class="flex flex-col gap-3.5">

      <!-- Avancement -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Route class="w-4 h-4 text-primary" /> Avancement de la tournée</h2>
          <span class="text-xs font-medium">{{ avancement.faits }}/{{ avancement.total }} sites · {{ avancement.pct }} %</span>
        </div>
        <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div class="h-full rounded-full transition-all"
            :class="avancement.pct === 100 ? 'bg-success' : 'bg-primary'"
            :style="{ width: avancement.pct + '%' }" />
        </div>
        <p class="text-[11px] text-muted-foreground mt-2 leading-relaxed">
          Le véhicule quitte sa base puis dessert les sites qui lui ont été affectés, dans l’ordre.
          Chaque ligne ci-dessous est une visite de site : ce qui était prévu, ce qui a été constaté.
        </p>
      </div>

      <!-- Déroulé site par site -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><MapPinned class="w-4 h-4 text-primary" /> Déroulé site par site</h2>
        </div>
        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">#</th>
            <th :class="L.th" class="cursor-default">Site</th>
            <th :class="L.th" class="cursor-default">Rôle</th>
            <th :class="L.th" class="cursor-default">Arrivée / Départ</th>
            <th :class="L.th" class="cursor-default">Volume prévu</th>
            <th :class="L.th" class="cursor-default">Volume constaté</th>
            <th :class="L.th" class="cursor-default">Bon</th>
            <th :class="L.th" class="cursor-default">État</th>
          </tr></thead>
          <tbody>
            <tr v-for="e in voyage.etapes" :key="e.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ e.ordre }}</span></td>
              <td :class="L.td">
                <span class="text-xs font-medium">{{ e.siteNom }}</span>
                <div v-if="e.observation" class="text-[11px] text-danger leading-snug mt-0.5">{{ e.observation }}</div>
              </td>
              <td :class="L.td">
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  :class="CLS_ROLE[e.role]">{{ LIB_ROLE_ETAPE[e.role] }}</span>
              </td>
              <td :class="L.td">
                <template v-if="e.heureArrivee">
                  <span class="text-xs">{{ fmtHeure(e.heureArrivee) }}</span>
                  <span v-if="e.heureDepart" class="text-xs text-muted-foreground"> → {{ fmtHeure(e.heureDepart) }}</span>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td :class="L.td">
                <span v-if="e.volumePrevuL" class="text-xs">{{ fmtL(e.volumePrevuL) }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td :class="L.td">
                <template v-if="e.volume15L">
                  <span class="text-xs font-semibold text-primary">{{ fmtL(e.volume15L) }}</span>
                  <div class="text-[10px] text-muted-foreground">
                    {{ fmtL(e.volumeAmbiantL) }} à {{ e.temperatureC }} °C
                  </div>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td :class="L.td">
                <span v-if="e.numeroBon" class="font-mono text-[11px]">{{ e.numeroBon }}</span>
                <span v-else class="text-gray-300">—</span>
                <div v-if="e.role === 'livraison'" class="text-[10px]"
                  :class="(e as any).podRecu ? 'text-success' : 'text-warning'">
                  {{ (e as any).podRecu ? 'POD reçu' : 'POD manquant' }}
                </div>
              </td>
              <td :class="L.td">
                <span v-if="e.franchi" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">Desservi</span>
                <span v-else class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">Non desservi</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bilan des livraisons -->
      <div :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Scale class="w-4 h-4 text-primary" /> Bilan des livraisons</h2>
          <span class="text-[11px] text-muted-foreground">volumes normalisés à 15 °C</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ coulageMulti.chargeL ? fmtL(coulageMulti.chargeL) : '—' }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Chargé au dépôt</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none">{{ coulageMulti.livreL ? fmtL(coulageMulti.livreL) : '—' }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Livré, tous sites</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="VERDICT[coulageMulti.verdict].text">
              {{ coulageMulti.ecartPourMille != null ? coulageMulti.ecartPourMille + ' ‰' : '—' }}
            </p>
            <p class="text-[11px] text-gray-500 mt-1">Écart consolidé</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xl font-bold leading-none" :class="coulageMulti.nonLivreL ? 'text-danger' : 'text-foreground'">
              {{ coulageMulti.nonLivreL ? fmtL(coulageMulti.nonLivreL) : '0 L' }}
            </p>
            <p class="text-[11px] text-gray-500 mt-1">Prévu non livré</p>
          </div>
        </div>

        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Site livré</th>
            <th :class="L.th" class="cursor-default">Prévu</th>
            <th :class="L.th" class="cursor-default">Livré à 15 °C</th>
            <th :class="L.th" class="cursor-default">Écart au prévu</th>
          </tr></thead>
          <tbody>
            <tr v-for="st in coulageMulti.sites" :key="st.etapeId" :class="L.rowHover">
              <td :class="L.td"><span class="text-xs font-medium">{{ st.ordre }}. {{ st.siteNom }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ st.prevuL ? fmtL(st.prevuL) : '—' }}</span></td>
              <td :class="L.td">
                <span v-if="st.volume15L" class="text-xs font-semibold">{{ fmtL(st.volume15L) }}</span>
                <span v-else class="text-[11px] text-danger font-medium">non livré</span>
              </td>
              <td :class="L.td">
                <span v-if="st.ecartSiteL != null" class="text-xs"
                  :class="Math.abs(st.ecartSiteL) > 200 ? 'text-danger font-medium' : 'text-muted-foreground'">
                  {{ st.ecartSiteL > 0 ? '+' : '' }}{{ st.ecartSiteL }} L
                </span>
                <span v-else class="text-gray-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="coulageMulti.verdict.startsWith('hors')"
          class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5 mt-3">
          <FileWarning class="w-4 h-4 shrink-0 mt-px" />
          <p class="text-xs leading-relaxed flex-1">
            Écart consolidé de <strong>{{ coulageMulti.ecartPourMille }} ‰</strong> pour une tolérance
            {{ voyage.clientNom }} de {{ coulageMulti.tolerance }} ‰. Le système peut pré-remplir la note de protêt.
          </p>
          <button :class="L.btnOutline" class="shrink-0" @click="tab = 'documents'">Préparer la note</button>
        </div>
      </div>
    </div>

    <!-- ══ VOLUMÉTRIE & COULAGE ═══════════════════════════════ -->
      <div v-else-if="tab === 'volumes'" class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Droplets class="w-4 h-4 text-primary" /> Chargement</h2></div>
          <div class="grid grid-cols-2 gap-3">
            <div :class="F.field">
              <label :class="F.fieldLabel">Volume ambiant (L)</label>
              <input type="number" :class="F.fieldInput" v-model.number="saisie.volumeChargeAmbiant" />
            </div>
            <div :class="F.field">
              <label :class="F.fieldLabel">Température (°C)</label>
              <input type="number" step="0.1" :class="F.fieldInput" v-model.number="saisie.temperatureChargement" />
            </div>
            <div :class="F.field">
              <label :class="F.fieldLabel">Densité à 15 °C</label>
              <input type="number" step="0.01" :class="F.fieldInput" v-model.number="saisie.densite" />
            </div>
            <div :class="F.field">
              <label :class="F.fieldLabel">Volume à 15 °C <span :class="F.fieldOptional">— calculé</span></label>
              <div class="h-9.5 px-2.5 rounded-md bg-primary/5 border border-primary/20 flex items-center font-mono text-[13px] font-semibold text-primary">
                {{ apercu.volumeCharge15?.toLocaleString('fr-FR') ?? '—' }} L
              </div>
            </div>
          </div>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Droplets class="w-4 h-4 text-primary" /> Déchargement</h2></div>
          <div class="grid grid-cols-2 gap-3">
            <div :class="F.field">
              <label :class="F.fieldLabel">Volume ambiant (L)</label>
              <input type="number" :class="F.fieldInput" v-model.number="saisie.volumeDechargeAmbiant" />
            </div>
            <div :class="F.field">
              <label :class="F.fieldLabel">Température (°C)</label>
              <input type="number" step="0.1" :class="F.fieldInput" v-model.number="saisie.temperatureDechargement" />
            </div>
            <div :class="F.field" class="col-span-2">
              <label :class="F.fieldLabel">Volume à 15 °C <span :class="F.fieldOptional">— calculé</span></label>
              <div class="h-9.5 px-2.5 rounded-md bg-primary/5 border border-primary/20 flex items-center font-mono text-[13px] font-semibold text-primary">
                {{ apercu.volumeDecharge15?.toLocaleString('fr-FR') ?? '—' }} L
              </div>
            </div>
          </div>
        </div>

        <!-- Écart de livraison -->
        <div :class="L.card" class="lg:col-span-2">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><Scale class="w-4 h-4 text-primary" /> Écart de livraison (coulage)</h2>
            <button :class="L.btnOutline" @click="enregistrerVolumes">Enregistrer</button>
          </div>

          <p class="text-[11px] text-muted-foreground mb-3">
            Le volume à 15 °C est calculé par le système à partir du volume ambiant, de la température et de la densité.
            Il n’est jamais ressaisi : c’est la première source d’erreur et de litige avec les distributeurs.
          </p>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p class="text-xl font-bold leading-none">{{ apercuCoulage.ecartL != null ? apercuCoulage.ecartL.toLocaleString('fr-FR') + ' L' : '—' }}</p>
              <p class="text-[11px] text-gray-500 mt-1">Écart en volume</p>
            </div>
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p class="text-xl font-bold leading-none" :class="VERDICT[apercuCoulage.verdict].text">
                {{ apercuCoulage.ecartPourMille != null ? apercuCoulage.ecartPourMille + ' ‰' : '—' }}
              </p>
              <p class="text-[11px] text-gray-500 mt-1">Écart relatif</p>
            </div>
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p class="text-xl font-bold leading-none">{{ apercuCoulage.tolerance }} ‰</p>
              <p class="text-[11px] text-gray-500 mt-1">Tolérance {{ voyage.clientNom }}</p>
            </div>
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p class="text-sm font-bold leading-tight" :class="VERDICT[apercuCoulage.verdict].text">
                {{ VERDICT[apercuCoulage.verdict].label }}
              </p>
              <p class="text-[11px] text-gray-500 mt-1">Verdict</p>
            </div>
          </div>

          <!-- Curseur de tolérance -->
          <div v-if="apercuCoulage.ecartPourMille != null" class="mb-3.5">
            <div class="relative h-7">
              <div class="absolute inset-x-0 top-3 h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
                <div class="h-full bg-success" :style="{ width: pctBarre(apercuCoulage.tolerance) + '%' }" />
                <div class="h-full bg-warning" :style="{ width: pctBarre(apercuCoulage.tolerance) + '%' }" />
                <div class="h-full bg-danger flex-1" />
              </div>
              <div class="absolute top-1 w-1 h-5 rounded-full bg-foreground shadow"
                :style="{ left: `calc(${curseur}% - 2px)` }" />
            </div>
            <div class="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>0 ‰</span>
              <span>{{ apercuCoulage.tolerance }} ‰ — tolérance</span>
              <span>{{ (apercuCoulage.tolerance * 3).toFixed(1) }} ‰</span>
            </div>
          </div>

          <div v-if="apercuCoulage.verdict.startsWith('hors')"
            class="flex items-start gap-2.5 bg-danger-bg text-danger rounded-lg px-3.5 py-2.5">
            <FileWarning class="w-4 h-4 shrink-0 mt-px" />
            <div class="text-xs leading-relaxed flex-1">
              Écart hors tolérance contractuelle. Le système peut pré-remplir le projet de note de protêt
              à partir du dossier de voyage.
            </div>
            <button :class="L.btnOutline" class="shrink-0" @click="tab = 'documents'">Préparer la note</button>
          </div>
        </div>
      </div>

      <!-- ══ DOCUMENTS ══════════════════════════════════════════ -->
      <div v-else-if="tab === 'documents'" class="flex flex-col gap-3.5">
        <div :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><FolderCheck class="w-4 h-4 text-primary" /> Pièces du dossier</h2>
            <span class="text-xs" :class="dossier.complet ? 'text-success' : 'text-warning'">
              {{ dossier.presents }}/{{ dossier.total }} pièces obligatoires
            </span>
          </div>
          <table :class="L.table">
            <thead>
              <tr>
                <th :class="L.th" class="cursor-default">Pièce</th>
                <th :class="L.th" class="cursor-default">N°</th>
                <th :class="L.th" class="cursor-default">Émetteur</th>
                <th :class="L.th" class="cursor-default">Date</th>
                <th :class="L.th" class="cursor-default">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in lignesDocs" :key="d.type" :class="L.rowHover">
                <td :class="L.td">
                  <span class="font-medium">{{ LIB_DOC[d.type] }}</span>
                  <span v-if="d.obligatoire" class="text-danger text-[11px]"> *</span>
                </td>
                <td :class="L.td"><span class="font-mono text-xs">{{ d.numero ?? '—' }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ d.emetteur ?? '—' }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDate(d.date) }}</span></td>
                <td :class="L.td">
                  <span v-if="d.present" class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-success-bg text-success">
                    Présent
                  </span>
                  <span v-else class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-danger-bg text-danger">
                    Manquant
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="apercuCoulage.verdict.startsWith('hors')" :class="L.card">
          <div :class="L.cardHeader">
            <h2 :class="L.cardTitle"><FileWarning class="w-4 h-4 text-danger" /> Projet de note de protêt</h2>
            <span class="text-[11px] text-muted-foreground">Pré-rempli depuis le dossier de voyage</span>
          </div>
          <div class="bg-background rounded-md px-3.5 py-3 text-xs leading-relaxed font-mono whitespace-pre-line">{{ projetNoteProtet }}</div>
          <button :class="L.btnPrimary" class="mt-2.5">Générer et transmettre</button>
        </div>
      </div>

      <!-- ══ ÉCARTS & ARRÊTS ════════════════════════════════════ -->
      <div v-else-if="tab === 'conformite'" class="flex flex-col gap-3.5">
        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle">Écarts détectés</h2></div>
          <div v-if="!ecarts.length" class="text-xs text-muted-foreground py-3">Aucun écart sur ce voyage.</div>
          <table v-else :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Écart</th>
              <th :class="L.th" class="cursor-default">Type</th>
              <th :class="L.th" class="cursor-default">Gravité</th>
              <th :class="L.th" class="cursor-default">Nature</th>
              <th :class="L.th" class="cursor-default"></th>
            </tr></thead>
            <tbody>
              <tr v-for="e in ecarts" :key="e.id" :class="L.rowHover">
                <td :class="L.td"><span class="font-mono text-xs">{{ e.id }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ LIB_TYPE_ECART[e.type] }}</span></td>
                <td :class="L.td"><span :class="LIB_GRAVITE[e.gravite].cls" class="text-[11px] font-medium px-2 py-0.5 rounded-full">{{ LIB_GRAVITE[e.gravite].label }}</span></td>
                <td :class="L.td"><span :class="LIB_NATURE[e.nature].cls" class="text-[11px] font-medium px-2 py-0.5 rounded-full">{{ LIB_NATURE[e.nature].label }}</span></td>
                <td :class="L.td"><button :class="L.actView" @click="router.push({ name: 'fleet-ecart-detail', params: { id: e.id } })">Ouvrir</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div :class="L.card">
          <div :class="L.cardHeader"><h2 :class="L.cardTitle">Arrêts relevés</h2></div>
          <table :class="L.table">
            <thead><tr>
              <th :class="L.th" class="cursor-default">Début</th>
              <th :class="L.th" class="cursor-default">Durée</th>
              <th :class="L.th" class="cursor-default">Lieu</th>
              <th :class="L.th" class="cursor-default">Statut</th>
              <th :class="L.th" class="cursor-default">Motif</th>
            </tr></thead>
            <tbody>
              <tr v-for="a in arrets" :key="a.id" :class="L.rowHover">
                <td :class="L.td"><span class="text-xs">{{ fmtDateTime(a.debut) }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ fmtDuree(a.dureeMin) }}</span></td>
                <td :class="L.td"><span class="text-xs">{{ a.lieu ?? '—' }}</span></td>
                <td :class="L.td">
                  <span v-if="a.dansSiteDeclare" class="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Site déclaré</span>
                  <span v-else-if="a.justifie" class="text-[11px] px-2 py-0.5 rounded-full bg-success-bg text-success">Justifié</span>
                  <span v-else class="text-[11px] px-2 py-0.5 rounded-full bg-danger-bg text-danger">Non justifié</span>
                </td>
                <td :class="L.td"><span class="text-xs text-muted-foreground">{{ a.motif ?? '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ CARBURANT ══════════════════════════════════════════ -->
      <div v-else-if="tab === 'carburant'" :class="L.card">
        <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Fuel class="w-4 h-4 text-primary" /> Recharges du voyage</h2></div>
        <div v-if="!recharges.length" class="text-xs text-muted-foreground py-3">Aucune recharge rattachée.</div>
        <table v-else :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Date</th>
            <th :class="L.th" class="cursor-default">Lieu</th>
            <th :class="L.th" class="cursor-default">Litres</th>
            <th :class="L.th" class="cursor-default">Montant</th>
            <th :class="L.th" class="cursor-default">Contrôles</th>
          </tr></thead>
          <tbody>
            <tr v-for="r in recharges" :key="r.id" :class="L.rowHover">
              <td :class="L.td"><span class="text-xs">{{ fmtDateTime(r.date) }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ r.lieu }}</span></td>
              <td :class="L.td"><span class="text-xs font-medium">{{ fmtL(r.litres) }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ fmtAr(r.montant) }}</span></td>
              <td :class="L.td">
                <span v-if="r.statut === 'valide'" class="text-[11px] px-2 py-0.5 rounded-full bg-success-bg text-success">Conforme</span>
                <button v-else class="text-[11px] px-2 py-0.5 rounded-full bg-danger-bg text-danger cursor-pointer border-0"
                  @click="router.push({ name: 'fleet-carburant', query: { recharge: r.id } })">
                  {{ r.controles.filter(c => !c.ok).length }} anomalie(s)
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
</div>
</template>

<script setup lang="ts">
/**
 * Dossier de voyage — vue pivot.
 * Rassemble en un seul écran l'itinéraire, la volumétrie et le coulage,
 * le dossier documentaire, les écarts et les recharges de carburant.
 */
import { ref, computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Package, CheckCircle2, AlertCircle, Droplets, Scale,
  FolderCheck, FileWarning, Fuel, Map as MapIcon, MapPinned, Route,
} from 'lucide-vue-next'
import FleetMap from '../../components/fleet/FleetMap.vue'
import { useVoyagesStore, LIB_DOC, DOCS_OBLIGATOIRES } from '../../stores/voyages'
import { useTrajetsStore } from '../../stores/trajets'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE, LIB_GRAVITE } from '../../stores/ecarts'
import { useCarburantStore } from '../../stores/carburant'
import { LIB_ROLE_ETAPE } from '../../types/fms'
import type { StatutVoyage, TypeDocVoyage, MapArret, MapMarker, ZoneCarte, RoleEtape } from '../../types/fms'
import {
  normaliserVolumes, calculerCoulage, calculerCoulageMultiSites, calculerEcartKm,
  analyserConformite, fmtDate, fmtDateTime, fmtDuree, fmtHeure, fmtAr, fmtL,
} from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const route  = useRoute()
const router = useRouter()
const store  = useVoyagesStore()
const trajetsStore = useTrajetsStore()
const ecartsStore    = useEcartsStore()
const carburantStore = useCarburantStore()

const voyage   = computed(() => store.getById(String(route.params.id)))
const trajet = computed(() => voyage.value?.trajetId ? trajetsStore.getById(voyage.value.trajetId) : undefined)
const ecarts   = computed(() => voyage.value ? ecartsStore.ecartsDuVoyage(voyage.value.id) : [])
const arrets   = computed(() => voyage.value ? store.arretsDuVoyage(voyage.value.id) : [])
const dossier  = computed(() => store.completudeDossier(String(route.params.id)))
const recharges = computed(() =>
  voyage.value ? carburantStore.recharges.filter(r => r.voyageId === voyage.value!.id) : [])

const tab = ref<'synthese' | 'sites' | 'volumes' | 'documents' | 'conformite' | 'carburant'>('synthese')

const tabs = computed(() => [
  { key: 'synthese' as const,   label: 'Synthèse' },
  { key: 'sites' as const,      label: 'Sites & livraisons',
    badge: coulageMulti.value.sites.filter(x => !x.livre).length },
  { key: 'volumes' as const,    label: 'Volumétrie & coulage' },
  { key: 'documents' as const,  label: 'Documents', badge: dossier.value.complet ? 0 : dossier.value.manquants.length },
  { key: 'conformite' as const, label: 'Conformité', badge: ecarts.value.filter(e => e.nature === 'a_qualifier').length },
  { key: 'carburant' as const,  label: 'Carburant' },
])

const STATUT: Record<StatutVoyage, { label: string; cls: string }> = {
  planifie: { label: 'Planifié',  cls: 'bg-gray-100 text-gray-600'  },
  affecte:  { label: 'Affecté',   cls: 'bg-primary/10 text-primary' },
  en_cours: { label: 'En cours',  cls: 'bg-info-bg text-info'       },
  livre:    { label: 'Livré',     cls: 'bg-success-bg text-success' },
  cloture:  { label: 'Clôturé',   cls: 'bg-gray-100 text-gray-500'  },
  litige:   { label: 'En litige', cls: 'bg-danger-bg text-danger'   },
  annule:   { label: 'Annulé',    cls: 'bg-gray-100 text-gray-400'  },
}

/** Couleur du badge selon le rôle du site dans la tournée. */
const CLS_ROLE: Record<RoleEtape, string> = {
  depart:     'bg-gray-100 text-gray-600',
  chargement: 'bg-primary/10 text-primary',
  livraison:  'bg-success-bg text-success',
  controle:   'bg-info-bg text-info',
  repos:      'bg-warning-bg text-warning',
  arrivee:    'bg-gray-100 text-gray-600',
}

const VERDICT = {
  incomplet:      { label: 'Incomplet',            text: 'text-gray-400' },
  dans_tolerance: { label: 'Dans la tolérance',    text: 'text-success'  },
  hors_mineur:    { label: 'Hors tolérance',       text: 'text-warning'  },
  hors_majeur:    { label: 'Hors tolérance majeur',text: 'text-danger'   },
}

/* ── Saisie volumétrique, avec aperçu calculé en direct ────── */
const saisie = reactive({
  volumeChargeAmbiant:    voyage.value?.volumes.volumeChargeAmbiant,
  temperatureChargement:  voyage.value?.volumes.temperatureChargement,
  densite:                voyage.value?.volumes.densite ?? 0.84,
  volumeDechargeAmbiant:  voyage.value?.volumes.volumeDechargeAmbiant,
  temperatureDechargement:voyage.value?.volumes.temperatureDechargement,
})

watch(voyage, v => {
  if (!v) return
  Object.assign(saisie, {
    volumeChargeAmbiant: v.volumes.volumeChargeAmbiant,
    temperatureChargement: v.volumes.temperatureChargement,
    densite: v.volumes.densite ?? 0.84,
    volumeDechargeAmbiant: v.volumes.volumeDechargeAmbiant,
    temperatureDechargement: v.volumes.temperatureDechargement,
  })
}, { immediate: true })

const apercu = computed(() =>
  normaliserVolumes({ produit: voyage.value?.volumes.produit ?? '', ...saisie }))

const apercuCoulage = computed(() =>
  calculerCoulage({ ...voyage.value!, volumes: apercu.value }))

const curseur = computed(() => {
  const c = apercuCoulage.value
  if (c.ecartPourMille == null) return 0
  return Math.min(100, Math.max(0, (c.ecartPourMille / (c.tolerance * 3)) * 100))
})

const pctBarre = (tolerance: number) => (tolerance / (tolerance * 3)) * 100

function enregistrerVolumes() {
  if (!voyage.value) return
  store.saisirVolumes(voyage.value.id, { ...saisie })
}

/* ── Mesures de synthèse ──────────────────────────────────── */
const mesures = computed(() => {
  const v = voyage.value!
  const km = calculerEcartKm(v, 5)
  const c  = calculerCoulage(v)
  return [
    { label: 'Km de référence', value: `${v.kmReference} km`, cls: 'text-foreground' },
    { label: 'Km réel',         value: km.kmReel != null ? `${km.kmReel} km` : '—',
      cls: km.horsTolerance ? 'text-danger' : 'text-foreground' },
    { label: 'Écart consolidé', value: coulageMulti.value.ecartPourMille != null ? `${coulageMulti.value.ecartPourMille} ‰` : '—',
      cls: VERDICT[coulageMulti.value.verdict].text },
    { label: 'Sites desservis',
      value: `${avancement.value.faits} / ${avancement.value.total}`,
      cls: avancement.value.faits < avancement.value.total ? 'text-danger' : 'text-success' },
  ]
})

/* ═══════════════════════════════════════════════════════════════════
   Points de passage — la conformité se calcule SUR EUX.
   Le trajet est une séquence de sites : un site est franchi si la trace
   télématique passe à moins du rayon de validation.
   ═══════════════════════════════════════════════════════════════════ */
const RAYON_VALIDATION_KM = 5

/** Coulage consolidé sur l'ensemble des sites livrés. */
const coulageMulti = computed(() =>
  voyage.value
    ? calculerCoulageMultiSites(voyage.value.etapes, voyage.value.toleranceCoulagePourMille, voyage.value.volumes.densite)
    : { chargeL: null, livreL: null, ecartL: null, ecartPourMille: null, tolerance: 1,
        verdict: 'incomplet' as const, sites: [], nonLivreL: 0 })

/** Avancement du voyage : sites desservis sur sites affectés. */
const avancement = computed(() => {
  const e = voyage.value?.etapes ?? []
  const faits = e.filter(x => x.franchi).length
  return { faits, total: e.length, pct: e.length ? Math.round((faits / e.length) * 100) : 0 }
})

/** Les étapes qui portent un volume : le chargement et les livraisons. */
const etapesVolume = computed(() =>
  voyage.value?.etapes.filter(e => e.role === 'chargement' || e.role === 'livraison') ?? [])

const conformite = computed(() =>
  analyserConformite(
    voyage.value?.etapes ?? [],
    voyage.value?.traceReel ?? [],
    RAYON_VALIDATION_KM,
  ))

/** Marqueurs numérotés : vert si franchi, rouge sinon. */
const marqueursEtapes = computed<MapMarker[]>(() =>
  conformite.value.points.map(pt => ({
    id: pt.id,
    lat: pt.lat,
    lng: pt.lng,
    label: `${pt.ordre}. ${pt.siteNom}`,
    sublabel: pt.franchi
      ? `${LIB_ROLE_ETAPE[pt.role as RoleEtape]} — franchi à ${pt.distanceMinKm} km`
      : `${LIB_ROLE_ETAPE[pt.role as RoleEtape]} — NON FRANCHI`,
    color: pt.franchi ? '#16a34a' : '#dc2626',
  })))

/** Rayon de validation matérialisé autour de chaque site. */
const zonesEtapes = computed<ZoneCarte[]>(() =>
  conformite.value.points.map(pt => ({
    id: `z-${pt.id}`,
    nom: pt.siteNom,
    type: pt.franchi ? 'obligatoire' : 'interdit',
    lat: pt.lat,
    lng: pt.lng,
    rayonM: RAYON_VALIDATION_KM * 1000,
  })))

const arretsCarte = computed<MapArret[]>(() =>
  arrets.value.filter(a => !a.dansSiteDeclare).map(a => ({
    id: a.id, lat: a.lat, lng: a.lng,
    label: a.lieu ?? 'Arrêt', dureeMin: a.dureeMin, justifie: a.justifie,
  })))

/* ── Documents : ligne par type attendu ───────────────────── */
const lignesDocs = computed(() => {
  const existants = store.documentsDuVoyage(String(route.params.id))
  const types: TypeDocVoyage[] = [
    ...DOCS_OBLIGATOIRES,
    ...existants.map(d => d.type).filter(t => !DOCS_OBLIGATOIRES.includes(t)),
  ]
  return [...new Set(types)].map(type => {
    const d = existants.find(x => x.type === type)
    return {
      type,
      numero: d?.numero, emetteur: d?.emetteur, date: d?.date,
      present: d?.present ?? false,
      obligatoire: DOCS_OBLIGATOIRES.includes(type),
    }
  })
})

const projetNoteProtet = computed(() => {
  const v = voyage.value!
  const c = apercuCoulage.value
  return `NOTE DE PROTÊT — projet généré automatiquement
Voyage        : ${v.reference}
Ordre GRT     : ${v.numeroOT ?? '—'}
Client        : ${v.clientNom}
Véhicule      : ${v.vehiculePlaque ?? '—'} / citerne ${v.citernePlaque ?? '—'}
Chauffeur     : ${v.chauffeurNom ?? '—'}
Produit       : ${v.volumes.produit}

Volume chargé (15 °C)    : ${apercu.value.volumeCharge15?.toLocaleString('fr-FR') ?? '—'} L
Volume déchargé (15 °C)  : ${apercu.value.volumeDecharge15?.toLocaleString('fr-FR') ?? '—'} L
Écart constaté           : ${c.ecartL?.toLocaleString('fr-FR') ?? '—'} L (${c.ecartPourMille} ‰)
Tolérance contractuelle  : ${c.tolerance} ‰

Motif présumé : ${v.nbArretsNonJustifies > 0
    ? 'écart de livraison hors tolérance, concomitant à un arrêt non planifié hors site déclaré'
    : 'écart de livraison hors tolérance'}`
})

/* ── Clôture ──────────────────────────────────────────────── */
const msgCloture = ref('')
function tenterCloture() {
  msgCloture.value = ''
  const r = store.cloturer(String(route.params.id))
  if (!r.ok) msgCloture.value = r.motif ?? 'Clôture impossible.'
}
</script>
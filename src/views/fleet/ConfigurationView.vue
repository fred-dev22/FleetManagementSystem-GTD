<template>
  <div :class="L.pagePadding">

    <div :class="L.pageHeader">
      <div>
        <h1 :class="L.pageTitle">Configuration</h1>
        <p :class="L.pageSub">Données de référence de l’exploitation</p>
      </div>
    </div>


    <!-- Onglets -->
    <div class="flex gap-1 border-b border-border mb-3.5 overflow-x-auto">
      <button
        v-for="t in onglets" :key="t.key" @click="onglet = t.key"
        class="px-3.5 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer bg-transparent"
        :class="onglet === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
      >
        {{ t.label }}
        <span v-if="t.compte" class="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ t.compte }}</span>
      </button>
    </div>

    <!-- ══ TRAJETS DE RÉFÉRENCE ══════════════════════════════ -->
    <div v-if="onglet === 'trajets'" class="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-3.5 items-start">
      <div class="flex flex-col gap-2">
        <button :class="L.btnPrimary" class="justify-center" @click="ouvrirNouveauTrajet">
          <Plus class="w-4 h-4" /> Nouveau trajet de référence
        </button>

        <label class="flex items-center gap-2 text-[11px] text-muted-foreground px-1 py-1 cursor-pointer">
          <input v-model="afficherArchives" type="checkbox" class="cursor-pointer" />
          Afficher les trajets archivés
        </label>

        <button
          v-for="t in trajetsAffiches" :key="t.id"
          class="text-left rounded-lg border px-3.5 py-3 cursor-pointer transition-colors"
          :class="trajetSel === t.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-background'"
          @click="trajetSel = t.id"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-semibold text-foreground">{{ t.code }}</span>
            <span
              class="text-[11px] font-medium px-2 py-0.5 rounded-full"
              :class="t.statut === 'actif' ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'"
            >{{ t.statut === 'actif' ? 'Actif' : 'Archivé' }}</span>
          </div>
          <p class="text-[13px] font-medium text-foreground">{{ t.libelle }}</p>
          <div class="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span>{{ t.etapes.length }} sites</span>
            <span>{{ t.distanceEstimeeKm }} km</span>
            <span>{{ fmtDuree(t.dureeEstimeeMin) }}</span>
          </div>
        </button>
      </div>

      <div v-if="trajet" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><Route class="w-4 h-4 text-primary" /> {{ trajet.libelle }}</h2>
          <div class="flex items-center gap-2">
            <span v-if="trajet.clientNom" class="text-[11px] text-muted-foreground">{{ trajet.clientNom }}</span>
            <button :class="L.actView" @click="ouvrirEditionTrajet(trajet)">
              <Pencil class="w-3 h-3" /> Modifier
            </button>
            <button v-if="trajet.statut === 'actif'" :class="L.actReject" @click="archiverTrajet(trajet.id)">
              <Archive class="w-3 h-3" /> Archiver
            </button>
            <button v-else :class="L.actView" @click="trajetsStore.update(trajet.id, { statut: 'actif' })">
              <Undo2 class="w-3 h-3" /> Réactiver
            </button>
          </div>
        </div>

        <FleetMap
          :trace-prevu="trajetsStore.traceDe(trajet.etapes)"
          :markers="marqueursTrajet"
          height="320px"
          :show-legend="false"
        />

        <table :class="L.table" class="mt-3">
          <thead><tr>
            <th :class="L.th" class="cursor-default">#</th>
            <th :class="L.th" class="cursor-default">Site</th>
            <th :class="L.th" class="cursor-default">Rôle</th>
            <th :class="L.th" class="cursor-default">Intervalle</th>
            <th :class="L.th" class="cursor-default">Pause</th>
          </tr></thead>
          <tbody>
            <tr v-for="(e, i) in trajet.etapes" :key="e.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ e.ordre }}</span></td>
              <td :class="L.td"><span class="text-xs font-medium">{{ e.siteNom }}</span></td>
              <td :class="L.td">
                <select
                  :value="e.role" :class="F.fieldSelect" class="!h-[28px] !text-[11px] w-[130px]"
                  @change="ev => majEtape(i, { role: (ev.target as HTMLSelectElement).value as RoleEtape })"
                >
                  <option v-for="(lib, r) in LIB_ROLE_ETAPE" :key="r" :value="r">{{ lib }}</option>
                </select>
              </td>
              <td :class="L.td">
                <input
                  :value="e.intervalleMin ?? 0" type="number" min="0" step="15"
                  :class="F.fieldInput" class="!h-[28px] !text-[11px] w-[80px]"
                  @change="ev => majEtape(i, { intervalleMin: Number((ev.target as HTMLInputElement).value) })"
                />
              </td>
              <td :class="L.td">
                <input
                  :value="e.pausePrevueMin ?? 0" type="number" min="0" step="15"
                  :class="F.fieldInput" class="!h-[28px] !text-[11px] w-[80px]"
                  @change="ev => majEtape(i, { pausePrevueMin: Number((ev.target as HTMLInputElement).value) })"
                />
              </td>
              <td :class="L.td">
                <div class="flex items-center gap-0.5">
                  <button :class="L.tbIconBtn" :disabled="i === 0" title="Monter" @click="deplacerEtape(i, -1)">
                    <ChevronUp class="w-3.5 h-3.5" />
                  </button>
                  <button :class="L.tbIconBtn" :disabled="i === trajet.etapes.length - 1" title="Descendre"
                    @click="deplacerEtape(i, 1)">
                    <ChevronDown class="w-3.5 h-3.5" />
                  </button>
                  <button :class="L.tbIconBtn" title="Retirer l’étape" @click="retirerEtape(i)">
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Ajout d'une étape : le trajet est une séquence de sites ordonnés,
             jamais un itinéraire calculé - US 2.4.2. -->
        <div class="flex flex-wrap items-end gap-2 mt-3">
          <div :class="F.field" class="min-w-[240px]">
            <label :class="F.fieldLabel">Ajouter un site à la séquence</label>
            <SearchableDropdown
              v-model="siteAAjouter" :items="optionsSites"
              placeholder="Choisir un site…" compact
            />
          </div>
          <div :class="F.field" class="w-[150px]">
            <label :class="F.fieldLabel">Rôle</label>
            <SearchableDropdown
              v-model="roleAAjouter"
              :items="optLIB_ROLE_ETAPE"
              placeholder="Sélectionner…"
            />
          </div>
          <button :class="L.btnOutline" class="!h-[32px] !py-0" :disabled="!siteAAjouter" @click="ajouterEtape">
            <Plus class="w-3.5 h-3.5" /> Ajouter
          </button>
          <p class="text-[11px] text-muted-foreground ml-auto">
            {{ trajet.distanceEstimeeKm }} km · {{ fmtDuree(trajet.dureeEstimeeMin) }},
            recalculés à chaque modification
          </p>
        </div>
      </div>

      <div v-else :class="L.card">
        <div class="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <Route class="w-8 h-8" />
          <p class="text-sm">Aucun trajet sélectionné</p>
          <p class="text-[11px]">Choisissez un trajet à gauche, ou créez-en un.</p>
        </div>
      </div>
    </div>

    <!-- ══ TYPES D'ÉCART ═════════════════════════════════════ -->
    <div v-else-if="onglet === 'ecarts'" class="flex flex-col gap-3.5">

      <div v-for="(liste, cat) in configStore.parCategorie" :key="cat" :class="L.card">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle">{{ LIB_CATEGORIE_ECART[cat] }}</h2>
          <span class="text-[11px] text-muted-foreground">{{ liste.length }} type(s)</span>
        </div>
        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Code</th>
            <th :class="L.th" class="cursor-default">Libellé</th>
            <th :class="L.th" class="cursor-default">Gravité</th>
            <th :class="L.th" class="cursor-default">Seuil</th>
            <th :class="L.th" class="cursor-default">Actif</th>
            <th :class="L.th" class="cursor-default"></th>
          </tr></thead>
          <tbody>
            <tr v-for="t in liste" :key="t.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs">{{ t.code }}</span></td>
              <td :class="L.td">
                <span class="text-xs font-medium">{{ t.libelle }}</span>
                <div v-if="t.description" class="text-[11px] text-muted-foreground">{{ t.description }}</div>
              </td>
              <td :class="L.td">
                <select
                  :value="t.gravite" :class="F.fieldSelect" class="!h-[28px] !text-[11px] w-[100px]"
                  @change="e => configStore.majTypeEcart(t.id, { gravite: (e.target as HTMLSelectElement).value as GraviteEcart })"
                >
                  <option value="mineur">Mineur</option>
                  <option value="majeur">Majeur</option>
                  <option value="critique">Critique</option>
                </select>
              </td>
              <td :class="L.td">
                <div v-if="t.seuilValeur != null" class="flex items-center gap-1">
                  <input
                    :value="t.seuilValeur" type="number" step="1"
                    :class="F.fieldInput" class="!h-[28px] !text-[11px] w-[70px]"
                    @change="ev => configStore.majTypeEcart(t.id, { seuilValeur: Number((ev.target as HTMLInputElement).value) })"
                  />
                  <span class="text-[11px] text-muted-foreground">{{ t.seuilUnite }}</span>
                </div>
                <span v-else class="text-gray-300">-</span>
              </td>
              <td :class="L.td">
                <button
                  class="text-[11px] font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer"
                  :class="t.actif ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'"
                  @click="configStore.basculerActif(t.id)"
                >{{ t.actif ? 'Actif' : 'Inactif' }}</button>
              </td>
              <td :class="L.td">
                <button :class="L.actView" @click="ouvrirEditionType(t)">
                  <Pencil class="w-3 h-3" /> Modifier
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ CLIENTS ═══════════════════════════════════════════
         Le nom du client était saisi librement, et sa tolérance de
         coulage vivait dans une constante d'un seul composant. Deux
         orthographes du même client coexistaient dans les données.
         ═══════════════════════════════════════════════════════ -->
    <div v-else-if="onglet === 'clients'" class="flex flex-col gap-3.5">

      <div v-if="clientsOrphelins.length"
        class="flex items-start gap-2.5 bg-warning-bg text-warning rounded-lg px-3.5 py-2.5">
        <AlertCircle class="w-4 h-4 shrink-0 mt-px" />
        <p class="text-xs leading-relaxed">
          {{ clientsOrphelins.length }} nom(s) présents dans les voyages ou les trajets ne
          correspondent à aucun client du référentiel : {{ clientsOrphelins.join(' · ') }}.
          Ces voyages n’ont pas de tolérance contractuelle rattachée.
        </p>
      </div>

      <div :class="L.card">
        <table :class="L.table">
          <thead><tr>
            <th :class="L.th" class="cursor-default">Code</th>
            <th :class="L.th" class="cursor-default">Nom</th>
            <th :class="L.th" class="cursor-default">Tolérance de coulage</th>
            <th :class="L.th" class="cursor-default">Contact</th>
            <th :class="L.th" class="cursor-default">Voyages</th>
            <th :class="L.th" class="cursor-default">Actif</th>
            <th :class="L.th" class="cursor-default"></th>
          </tr></thead>
          <tbody>
            <tr v-for="c in clientsStore.clients" :key="c.id" :class="L.rowHover">
              <td :class="L.td"><span class="font-mono text-xs font-semibold">{{ c.code }}</span></td>
              <td :class="L.td">
                <span class="text-xs font-medium">{{ c.nom }}</span>
                <div v-if="c.notes" class="text-[11px] text-muted-foreground">{{ c.notes }}</div>
              </td>
              <td :class="L.td">
                <div class="flex items-center gap-1">
                  <input
                    :value="c.toleranceCoulagePourMille" type="number" step="0.1" min="0"
                    :class="F.fieldInput" class="!h-[28px] !text-[11px] w-[70px]"
                    @change="ev => clientsStore.maj(c.id, { toleranceCoulagePourMille: Number((ev.target as HTMLInputElement).value) })"
                  />
                  <span class="text-[11px] text-muted-foreground">‰</span>
                </div>
              </td>
              <td :class="L.td"><span class="text-xs text-muted-foreground">{{ c.contact ?? '-' }}</span></td>
              <td :class="L.td"><span class="text-xs">{{ nbVoyages(c) }}</span></td>
              <td :class="L.td">
                <button
                  class="text-[11px] font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer"
                  :class="c.actif ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-400'"
                  @click="clientsStore.basculerActif(c.id)"
                >{{ c.actif ? 'Actif' : 'Inactif' }}</button>
              </td>
              <td :class="L.td">
                <button :class="L.actView" @click="ouvrirEditionClient(c)">
                  <Pencil class="w-3 h-3" /> Modifier
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ PARAMÈTRES ════════════════════════════════════════ -->

    <div v-else-if="onglet === 'parametres'" class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
      <div :class="L.card">
        <div :class="L.cardHeader"><h2 :class="L.cardTitle"><Clock class="w-4 h-4 text-primary" /> Temps réglementaires</h2></div>
        <div class="grid grid-cols-2 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Conduite continue max (min)</label>
            <input v-model.number="p.tccMaxMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Arrêt après conduite continue (min)</label>
            <input v-model.number="p.pauseApresTccMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Conduite journalière max (min)</label>
            <input v-model.number="p.tcjMaxMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Travail journalier max (min)</label>
            <input v-model.number="p.ttjMaxMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Repos hebdomadaire (h)</label>
            <input v-model.number="p.trhMinH" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Plafond hebdomadaire (h)</label>
            <input v-model.number="p.plafondHebdoH" type="number" :class="F.fieldInput" />
          </div>
        </div>
      </div>

      <div :class="L.card">
        <div :class="L.cardHeader"><h2 :class="L.cardTitle"><SlidersHorizontal class="w-4 h-4 text-primary" /> Seuils d’exploitation</h2></div>
        <div class="grid grid-cols-2 gap-3">
          <div :class="F.field">
            <label :class="F.fieldLabel">Litres par bon de carburant</label>
            <input v-model.number="p.litresParBonDefaut" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Tolérance kilométrique (%)</label>
            <input v-model.number="p.toleranceKmPct" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Seuil d’arrêt non planifié (min)</label>
            <input v-model.number="p.seuilArretMin" type="number" :class="F.fieldInput" />
          </div>
          <div :class="F.field">
            <label :class="F.fieldLabel">Plafond bihebdomadaire (h)</label>
            <input v-model.number="p.plafondBihebdoH" type="number" :class="F.fieldInput" />
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════
           Seuils d'alerte - US 3.1.2, 2.5.2, 2.7.1
           Ces trois seuils gouvernent le déclenchement des alertes.
           Ils étaient figés dans le code : l'exploitation devait passer
           par un développeur pour ajuster un préavis. Ils sont ici.
           ═══════════════════════════════════════════════════════ -->
      <div :class="L.card" class="lg:col-span-2">
        <div :class="L.cardHeader">
          <h2 :class="L.cardTitle"><BellRing class="w-4 h-4 text-primary" /> Seuils d’alerte</h2>
          <span class="text-[11px] text-muted-foreground">
            ajustables sans intervention technique
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <!-- Préavis d'alerte préventive -->
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold text-foreground">Préavis d’entretien préventif</p>
            <div class="grid grid-cols-2 gap-2">
              <div :class="F.field">
                <label :class="F.fieldLabel">Kilomètres avant</label>
                <input v-model.number="p.preavisEntretienKm" type="number" min="0"
                  :class="[F.fieldInput, configStore.seuilHorsBornes('preavisEntretienKm') ? F.inputError : '']" />
              </div>
              <div :class="F.field">
                <label :class="F.fieldLabel">Jours avant</label>
                <input v-model.number="p.preavisEntretienJours" type="number" min="0"
                  :class="[F.fieldInput, configStore.seuilHorsBornes('preavisEntretienJours') ? F.inputError : '']" />
              </div>
            </div>
            <p v-if="configStore.seuilHorsBornes('preavisEntretienKm')" :class="F.fieldError">
              <AlertCircle class="w-3 h-3" />
              Attendu entre {{ B.preavisEntretienKm.min }} et
              {{ B.preavisEntretienKm.max.toLocaleString('fr-FR') }} km.
            </p>
          </div>

          <!-- Rayon de validation d'un passage -->
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold text-foreground">Rayon de validation d’un passage</p>
            <div :class="F.field">
              <label :class="F.fieldLabel">Distance au site (m)</label>
              <input v-model.number="p.rayonValidationPassageM" type="number" min="0" step="100"
                :class="[F.fieldInput, configStore.seuilHorsBornes('rayonValidationPassageM') ? F.inputError : '']" />
            </div>
            <p v-if="configStore.seuilHorsBornes('rayonValidationPassageM')" :class="F.fieldError">
              <AlertCircle class="w-3 h-3" />
              Attendu entre {{ B.rayonValidationPassageM.min }} et
              {{ B.rayonValidationPassageM.max.toLocaleString('fr-FR') }} m.
            </p>
          </div>

          <!-- Préavis d'échéance documentaire -->
          <div class="flex flex-col gap-2">
            <p class="text-xs font-semibold text-foreground">Préavis d’échéance documentaire</p>
            <div :class="F.field">
              <label :class="F.fieldLabel">Jours avant expiration</label>
              <input v-model.number="p.preavisDocumentaireJours" type="number" min="0"
                :class="[F.fieldInput, configStore.seuilHorsBornes('preavisDocumentaireJours') ? F.inputError : '']" />
            </div>
            <p v-if="configStore.seuilHorsBornes('preavisDocumentaireJours')" :class="F.fieldError">
              <AlertCircle class="w-3 h-3" />
              Attendu entre {{ B.preavisDocumentaireJours.min }} et
              {{ B.preavisDocumentaireJours.max }} jours.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
  <!-- ══ Trajet de référence : création et modification ═══════ -->
  <div v-if="formTrajet" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    @click.self="formTrajet = null">
    <div class="bg-card rounded-lg border border-border shadow-lg w-full max-w-lg p-4">
      <h3 class="text-sm font-semibold text-foreground mb-3">
        {{ formTrajet.id ? 'Modifier le trajet' : 'Nouveau trajet de référence' }}
      </h3>

      <div class="grid grid-cols-2 gap-3">
        <div :class="F.field">
          <label :class="F.fieldLabel">Code *</label>
          <input v-model="formTrajet.code" type="text" :class="F.fieldInput" placeholder="TNR-TMV" />
        </div>
        <div :class="F.field">
          <label :class="F.fieldLabel">Client</label>
          <SearchableDropdown
            v-model="formTrajet.clientId" :items="optionsClients"
            placeholder="Aucun client attitré"
          />
        </div>
        <div :class="F.field" class="col-span-2">
          <label :class="F.fieldLabel">Libellé *</label>
          <input v-model="formTrajet.libelle" type="text" :class="F.fieldInput"
            placeholder="Antananarivo → Toamasina" />
        </div>
        <label class="col-span-2 flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <input v-model="formTrajet.recurrent" type="checkbox" class="cursor-pointer" />
          Trajet récurrent, proposé par défaut à la création d’un voyage
        </label>
      </div>

      <p v-if="erreurTrajet" :class="F.fieldError" class="mt-2">
        <AlertCircle class="w-3 h-3" /> {{ erreurTrajet }}
      </p>


      <div class="flex justify-end gap-2 mt-4">
        <button :class="F.btnOutline" @click="formTrajet = null">Annuler</button>
        <button :class="F.btnPrimary" @click="enregistrerTrajet">
          {{ formTrajet.id ? 'Enregistrer' : 'Créer' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ══ Type d'écart : création et modification ══════════════ -->
  <div v-if="formType" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    @click.self="formType = null">
    <div class="bg-card rounded-lg border border-border shadow-lg w-full max-w-lg p-4">
      <h3 class="text-sm font-semibold text-foreground mb-3">
        {{ formType.id ? 'Modifier le type d’écart' : 'Nouveau type d’écart' }}
      </h3>

      <div class="grid grid-cols-2 gap-3">
        <div :class="F.field">
          <label :class="F.fieldLabel">Code *</label>
          <input v-model="formType.code" type="text" :class="F.fieldInput" placeholder="VOL-MANQ" />
        </div>
        <div :class="F.field">
          <label :class="F.fieldLabel">Catégorie *</label>
          <SearchableDropdown
            v-model="formType.categorie"
            :items="optLIB_CATEGORIE_ECART"
            placeholder="Sélectionner…"
          />
        </div>
        <div :class="F.field" class="col-span-2">
          <label :class="F.fieldLabel">Libellé *</label>
          <input v-model="formType.libelle" type="text" :class="F.fieldInput" />
        </div>
        <div :class="F.field">
          <label :class="F.fieldLabel">Gravité *</label>
          <SearchableDropdown
            v-model="formType.gravite"
            :items="optformType_gravite"
            placeholder="Sélectionner…"
          />
        </div>
        <div :class="F.field">
          <label :class="F.fieldLabel">Seuil et unité</label>
          <div class="flex gap-2">
            <input v-model.number="formType.seuilValeur" type="number" :class="F.fieldInput"
              class="w-[90px]" placeholder="Valeur" />
            <input v-model="formType.seuilUnite" type="text" :class="F.fieldInput"
              placeholder="L, %, min…" />
          </div>
        </div>
        <div :class="F.field" class="col-span-2">
          <label :class="F.fieldLabel">Description</label>
          <textarea v-model="formType.description" rows="2" :class="F.fieldInput"
            placeholder="Ce que la règle constate, et à partir de quand." />
        </div>
      </div>

      <p v-if="erreurType" :class="F.fieldError" class="mt-2">
        <AlertCircle class="w-3 h-3" /> {{ erreurType }}
      </p>

      <div class="flex justify-end gap-2 mt-4">
        <button :class="F.btnOutline" @click="formType = null">Annuler</button>
        <button :class="F.btnPrimary" @click="enregistrerType">
          {{ formType.id ? 'Enregistrer' : 'Créer' }}
        </button>
      </div>
    </div>
  </div>
  <!-- ══ Client : création et modification ════════════════════ -->
  <div v-if="formClient" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    @click.self="formClient = null">
    <div class="bg-card rounded-lg border border-border shadow-lg w-full max-w-lg p-4">
      <h3 class="text-sm font-semibold text-foreground mb-3">
        {{ formClient.id ? 'Modifier le client' : 'Nouveau client' }}
      </h3>

      <div class="grid grid-cols-2 gap-3">
        <div :class="F.field">
          <label :class="F.fieldLabel">Code *</label>
          <input v-model="formClient.code" type="text" :class="F.fieldInput" placeholder="VIVO" />
        </div>
        <div :class="F.field">
          <label :class="F.fieldLabel">Tolérance de coulage (‰) *</label>
          <input v-model.number="formClient.toleranceCoulagePourMille" type="number"
            step="0.1" min="0" :class="F.fieldInput" placeholder="1" />
        </div>
        <div :class="F.field" class="col-span-2">
          <label :class="F.fieldLabel">Nom *</label>
          <input v-model="formClient.nom" type="text" :class="F.fieldInput"
            placeholder="Vivo Energy Madagascar" />
        </div>
        <div :class="F.field">
          <label :class="F.fieldLabel">Contact</label>
          <input v-model="formClient.contact" type="text" :class="F.fieldInput" />
        </div>
        <div :class="F.field">
          <label :class="F.fieldLabel">Téléphone</label>
          <input v-model="formClient.telephone" type="text" :class="F.fieldInput" />
        </div>
        <div :class="F.field" class="col-span-2">
          <label :class="F.fieldLabel">Notes</label>
          <textarea v-model="formClient.notes" rows="2" :class="F.fieldInput"
            placeholder="Particularités contractuelles, anciennes graphies du nom…" />
        </div>
      </div>


      <p v-if="erreurClient" :class="F.fieldError" class="mt-2">
        <AlertCircle class="w-3 h-3" /> {{ erreurClient }}
      </p>

      <div class="flex justify-end gap-2 mt-4">
        <button :class="F.btnOutline" @click="formClient = null">Annuler</button>
        <button :class="F.btnPrimary" @click="enregistrerClient">
          {{ formClient.id ? 'Enregistrer' : 'Créer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Configuration - page unique regroupant les données de référence.
 * Décision de séance : un seul bouton « Configuration » plutôt que des
 * réglages dispersés dans chaque écran.
 */
import { ref, computed } from 'vue'
import {
  Info, Route, Clock, SlidersHorizontal, BellRing, AlertCircle,
  Plus, Pencil, Archive, Undo2, ChevronUp, ChevronDown, X,
} from 'lucide-vue-next'
import SearchableDropdown from '../../components/ui/SearchableDropdown.vue'
import type { DropdownItem } from '../../components/ui/SearchableDropdown.vue'
import FleetMap from '../../components/fleet/FleetMap.vue'
import { useTrajetsStore } from '../../stores/trajets'
import { useConfigurationStore } from '../../stores/configuration'
import { useSitesStore } from '../../stores/sites'
import { useClientsStore } from '../../stores/clients'
import { useVoyagesStore } from '../../stores/voyages'
import { LIB_ROLE_ETAPE, LIB_CATEGORIE_ECART } from '../../types/fms'
import type {
  GraviteEcart, MapMarker, RoleEtape, Trajet, EtapeTrajet,
  TypeEcartConfig, CategorieEcart, Client,
} from '../../types/fms'
import { fmtDuree } from '../../lib/fmsUtils'
import * as L from '../../lib/listClasses'
import * as F from '../../lib/formClasses'

const trajetsStore = useTrajetsStore()
const configStore = useConfigurationStore()
const sitesStore   = useSitesStore()
const clientsStore = useClientsStore()
const voyagesStore = useVoyagesStore()

const onglet = ref<'trajets' | 'clients' | 'ecarts' | 'parametres'>('trajets')
const trajetSel = ref<string | null>(trajetsStore.trajets[0]?.id ?? null)

const onglets = computed(() => [
  { key: 'trajets' as const,    label: 'Trajets de référence', compte: trajetsStore.trajets.length },
  { key: 'clients' as const,    label: 'Clients',              compte: clientsStore.clients.length },
  { key: 'ecarts' as const,     label: 'Types d’écart',        compte: configStore.typesEcart.length },
  { key: 'parametres' as const, label: 'Paramètres',           compte: 0 },
])

const trajet = computed(() => trajetSel.value ? trajetsStore.getById(trajetSel.value) : undefined)

const marqueursTrajet = computed<MapMarker[]>(() =>
  trajet.value
    ? trajet.value.etapes.map(e => ({
        id: e.id, lat: e.lat, lng: e.lng,
        label: `${e.ordre}. ${e.siteNom}`,
        sublabel: LIB_ROLE_ETAPE[e.role],
      }))
    : [])

const p = configStore.parametres

/** Bornes de saisie, affichées dans les messages d'erreur des seuils. */
const B = configStore.BORNES_SEUILS
/* ══════════════════════════════════════════════════════════════
   Édition des données de référence
   ══════════════════════════════════════════════════════════════
   Les fonctions de création et de modification existaient dans les
   stores depuis le début, mais aucun écran ne les appelait : on
   pouvait consulter les règles, pas les définir. Elles sont ici.

   Un principe : chaque règle se modifie à un seul endroit, celui du
   domaine auquel elle appartient. Les plans d'entretien relèvent de la
   maintenance et ne figurent donc pas ici : deux éditeurs sur le même
   objet divergent à la première évolution.
   ══════════════════════════════════════════════════════════════ */

/* ── Trajets de référence ───────────────────────────────────── */

const afficherArchives = ref(false)

const trajetsAffiches = computed(() =>
  afficherArchives.value
    ? trajetsStore.trajets
    : trajetsStore.trajets.filter(t => t.statut === 'actif'))

interface FormTrajet {
  id?: string
  code: string
  libelle: string
  /** Identifiant du client, pas son nom : le nom se recopie à l'écriture */
  clientId: string
  recurrent: boolean
}

const formTrajet   = ref<FormTrajet | null>(null)
const erreurTrajet = ref('')

function ouvrirNouveauTrajet() {
  erreurTrajet.value = ''
  formTrajet.value = { code: '', libelle: '', clientId: '', recurrent: true }
}

function ouvrirEditionTrajet(t: Trajet) {
  erreurTrajet.value = ''
  formTrajet.value = {
    id: t.id, code: t.code, libelle: t.libelle,
    /* Les trajets existants portent un nom libre : on retrouve le client
       correspondant plutôt que de vider le champ à l'ouverture. */
    clientId: clientsStore.retrouverParNom(t.clientNom)?.id ?? '',
    recurrent: t.recurrent,
  }
}

/** Un code en double rendrait deux trajets indiscernables dans les voyages. */
function enregistrerTrajet() {
  const f = formTrajet.value
  if (!f) return
  erreurTrajet.value = ''

  if (!f.code.trim() || !f.libelle.trim()) {
    erreurTrajet.value = 'Le code et le libellé sont obligatoires.'
    return
  }
  const doublon = trajetsStore.trajets.some(
    t => t.id !== f.id && t.code.trim().toUpperCase() === f.code.trim().toUpperCase())
  if (doublon) {
    erreurTrajet.value = `Le code ${f.code.trim().toUpperCase()} est déjà utilisé.`
    return
  }

  const donnees = {
    code: f.code.trim().toUpperCase(),
    libelle: f.libelle.trim(),
    clientNom: clientsStore.getById(f.clientId)?.nom,
    recurrent: f.recurrent,
  }

  if (f.id) {
    trajetsStore.update(f.id, donnees)
  } else {
    trajetsStore.create({ ...donnees, etapes: [], statut: 'actif' })
    trajetSel.value = trajetsStore.trajets[0]?.id ?? null
  }
  formTrajet.value = null
}

/** Archiver plutôt que supprimer : les voyages passés y font référence. */
function archiverTrajet(id: string) {
  trajetsStore.archiver(id)
}

/* ── Étapes du trajet sélectionné ───────────────────────────── */

const siteAAjouter = ref('')
const roleAAjouter = ref<RoleEtape>('livraison')

/** Sites actifs, y compris ceux déjà présents : un aller-retour repasse
 *  par le même dépôt, l'exclure interdirait de composer le retour. */
const sitesDisponibles = computed(() =>
  sitesStore.sitesActifs.filter(st => st.latitude != null && st.longitude != null))

const optionsSites = computed<DropdownItem[]>(() =>
  sitesDisponibles.value.map(st => ({ id: st.id, label: st.nom, sublabel: st.code })))

const optionsClients = computed<DropdownItem[]>(() =>
  clientsStore.clients.map(c => ({
    id: c.id, label: c.nom,
    sublabel: `Tolérance ${c.toleranceCoulagePourMille} ‰`,
    itemDisabled: !c.actif, disabledReason: 'Client désactivé',
  })))


function ajouterEtape() {
  const t = trajet.value
  const site = sitesStore.getSiteById(siteAAjouter.value)
  if (!t || !site) return
  /* Les coordonnées sont facultatives sur un site mais indispensables à une
     étape : sans elles, le trajet ne se trace pas et la distance ne se
     calcule pas. Le site est écarté plutôt que d'entrer avec des zéros. */
  if (site.latitude == null || site.longitude == null) return
  const etape = trajetsStore.nouvelleEtape(
    { id: site.id, nom: site.nom, latitude: site.latitude, longitude: site.longitude },
    t.etapes.length + 1, roleAAjouter.value,
  )
  trajetsStore.update(t.id, { etapes: [...t.etapes, etape] })
  siteAAjouter.value = ''
}

function majEtape(index: number, data: Partial<EtapeTrajet>) {
  const t = trajet.value
  if (!t) return
  const etapes = t.etapes.map((e, i) => i === index ? { ...e, ...data } : e)
  trajetsStore.update(t.id, { etapes })
}

function retirerEtape(index: number) {
  const t = trajet.value
  if (!t) return
  trajetsStore.update(t.id, { etapes: t.etapes.filter((_, i) => i !== index) })
}

/** Le store renumérote et recalcule distance et durée à chaque écriture. */
function deplacerEtape(index: number, sens: -1 | 1) {
  const t = trajet.value
  if (!t) return
  const cible = index + sens
  if (cible < 0 || cible >= t.etapes.length) return
  const etapes = [...t.etapes]
  const [deplacee] = etapes.splice(index, 1)
  etapes.splice(cible, 0, deplacee!)
  trajetsStore.update(t.id, { etapes })
}

/* ── Types d'écart ──────────────────────────────────────────── */

interface FormType {
  id?: string
  code: string
  libelle: string
  categorie: CategorieEcart
  gravite: GraviteEcart
  seuilValeur: number | null
  seuilUnite: string
  description: string
}

const formType   = ref<FormType | null>(null)
const erreurType = ref('')

function ouvrirNouveauType() {
  erreurType.value = ''
  formType.value = {
    code: '', libelle: '', categorie: 'itineraire', gravite: 'majeur',
    seuilValeur: null, seuilUnite: '', description: '',
  }
}

function ouvrirEditionType(t: TypeEcartConfig) {
  erreurType.value = ''
  formType.value = {
    id: t.id, code: t.code, libelle: t.libelle, categorie: t.categorie,
    gravite: t.gravite, seuilValeur: t.seuilValeur ?? null,
    seuilUnite: t.seuilUnite ?? '', description: t.description ?? '',
  }
}

function enregistrerType() {
  const f = formType.value
  if (!f) return
  erreurType.value = ''

  if (!f.code.trim() || !f.libelle.trim()) {
    erreurType.value = 'Le code et le libellé sont obligatoires.'
    return
  }
  const doublon = configStore.typesEcart.some(
    t => t.id !== f.id && t.code.trim().toUpperCase() === f.code.trim().toUpperCase())
  if (doublon) {
    erreurType.value = `Le code ${f.code.trim().toUpperCase()} est déjà utilisé.`
    return
  }
  /* Un seuil sans unité ne se lit pas : « 5 » ne dit ni litres ni pourcent. */
  if (f.seuilValeur != null && !f.seuilUnite.trim()) {
    erreurType.value = 'Un seuil doit porter son unité : litres, pourcent, minutes…'
    return
  }

  const donnees = {
    code: f.code.trim().toUpperCase(),
    libelle: f.libelle.trim(),
    categorie: f.categorie,
    gravite: f.gravite,
    seuilValeur: f.seuilValeur ?? undefined,
    seuilUnite: f.seuilUnite.trim() || undefined,
    description: f.description.trim() || undefined,
  }

  if (f.id) configStore.majTypeEcart(f.id, donnees)
  else configStore.creerTypeEcart({ ...donnees, actif: true })
  formType.value = null
}

/* ── Référentiel clients ────────────────────────────────────── */

interface FormClient {
  id?: string
  code: string
  nom: string
  toleranceCoulagePourMille: number
  contact: string
  telephone: string
  notes: string
}

const formClient   = ref<FormClient | null>(null)
const erreurClient = ref('')

function ouvrirNouveauClient() {
  erreurClient.value = ''
  formClient.value = {
    code: '', nom: '', toleranceCoulagePourMille: 1,
    contact: '', telephone: '', notes: '',
  }
}

function ouvrirEditionClient(c: Client) {
  erreurClient.value = ''
  formClient.value = {
    id: c.id, code: c.code, nom: c.nom,
    toleranceCoulagePourMille: c.toleranceCoulagePourMille,
    contact: c.contact ?? '', telephone: c.telephone ?? '', notes: c.notes ?? '',
  }
}

function enregistrerClient() {
  const f = formClient.value
  if (!f) return
  erreurClient.value = ''

  if (f.toleranceCoulagePourMille == null || f.toleranceCoulagePourMille < 0) {
    erreurClient.value = 'La tolérance de coulage est obligatoire et ne peut pas être négative.'
    return
  }

  const donnees = {
    code: f.code, nom: f.nom,
    toleranceCoulagePourMille: f.toleranceCoulagePourMille,
    contact: f.contact.trim() || undefined,
    telephone: f.telephone.trim() || undefined,
    notes: f.notes.trim() || undefined,
  }

  const res = f.id
    ? clientsStore.maj(f.id, donnees)
    : clientsStore.creer({ ...donnees, actif: true })

  if ('erreur' in res) { erreurClient.value = res.erreur; return }
  formClient.value = null
}

const nbVoyages = (c: Client) =>
  voyagesStore.voyages.filter(v => clientsStore.retrouverParNom(v.clientNom)?.id === c.id).length

/** Noms employés dans les données mais absents du référentiel. */
const clientsOrphelins = computed(() => clientsStore.nomsOrphelins([
  ...voyagesStore.voyages.map(v => v.clientNom),
  ...trajetsStore.trajets.map(t => t.clientNom ?? ''),
]))

const optformType_gravite: DropdownItem[] = [
            { id: 'mineur', label: "Mineur" },
            { id: 'majeur', label: "Majeur" },
            { id: 'critique', label: "Critique" },
]

const optLIB_ROLE_ETAPE = computed<DropdownItem[]>(() =>
  Object.entries(LIB_ROLE_ETAPE).map(([id, lib]) => ({ id, label: String(lib) })))

const optLIB_CATEGORIE_ECART = computed<DropdownItem[]>(() =>
  Object.entries(LIB_CATEGORIE_ECART).map(([id, lib]) => ({ id, label: String(lib) })))
</script>

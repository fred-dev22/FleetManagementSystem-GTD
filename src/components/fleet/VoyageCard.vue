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
             1. IDENTIFICATION — d'où vient l'ordre de transport
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
              <span class="text-sm font-mono text-gray-600">{{ item.numeroOT ?? '—' }}</span>
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
              <span class="text-sm text-foreground">{{ item.volumes.densite ?? '—' }}</span>
            </div>
          </div>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             2. AFFECTATION — qui roule, avec quoi
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Affectation"
          :recaps="[item.vehiculePlaque, item.chauffeurNom]"
        >
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Tracteur</label>
              <span class="text-sm font-mono font-semibold text-foreground">{{ item.vehiculePlaque ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Citerne attelée</label>
              <span class="text-sm font-mono text-foreground">{{ item.citernePlaque ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">
                Chauffeur <span :class="F.fieldOptional">— déduit de l’affectation</span>
              </label>
              <span class="text-sm text-foreground">{{ item.chauffeurNom ?? '—' }}</span>
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
             3. PLAN DE TRAJET — la liste des sites affectés
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
             4. DÉROULÉ SITE PAR SITE — le cœur du dossier
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
                <td class="py-2 text-xs">{{ e.heureArrivee ? fmtHeure(e.heureArrivee) : '—' }}</td>
                <td class="py-2">
                  <span v-if="e.volume15L" class="text-xs font-semibold text-primary">{{ fmtL(e.volume15L) }}</span>
                  <span v-else-if="e.volumePrevuL" class="text-xs text-muted-foreground">{{ fmtL(e.volumePrevuL) }} prévu</span>
                  <span v-else class="text-gray-300">—</span>
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
             Source : « Gestion Opération » — ATA, A15°, tolérances
             ═══════════════════════════════════════════════════ -->
        <FormSection
          title="Volumétrie & coulage"
          :recaps="[coulage.ecartPourMille != null ? `${coulage.ecartPourMille} ‰` : 'incomplet', VERDICT[coulage.verdict].label]"
        >
          <div class="grid grid-cols-4 gap-3 mb-4 max-sm:grid-cols-2">
            <div>
              <label :class="F.fieldLabel">Chargé à 15 °C</label>
              <p class="text-lg font-bold text-foreground">{{ coulage.chargeL ? fmtL(coulage.chargeL) : '—' }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Livré, tous sites</label>
              <p class="text-lg font-bold text-foreground">{{ coulage.livreL ? fmtL(coulage.livreL) : '—' }}</p>
            </div>
            <div>
              <label :class="F.fieldLabel">Écart consolidé</label>
              <p class="text-lg font-bold" :class="VERDICT[coulage.verdict].text">
                {{ coulage.ecartPourMille != null ? coulage.ecartPourMille + ' ‰' : '—' }}
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
                <td class="py-2 text-xs">{{ st.prevuL ? fmtL(st.prevuL) : '—' }}</td>
                <td class="py-2 text-xs">
                  <template v-if="st.ambiantL">
                    {{ fmtL(st.ambiantL) }}
                    <span class="text-[10px] text-muted-foreground">à {{ st.temperatureC }} °C</span>
                  </template>
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="py-2 text-xs font-semibold text-primary">{{ st.volume15L ? fmtL(st.volume15L) : '—' }}</td>
                <td class="py-2 text-xs">
                  <span v-if="st.ecartSiteL != null"
                    :class="Math.abs(st.ecartSiteL) > 200 ? 'text-danger font-medium' : 'text-muted-foreground'">
                    {{ st.ecartSiteL > 0 ? '+' : '' }}{{ st.ecartSiteL }} L
                  </span>
                  <span v-else class="text-gray-300">—</span>
                </td>
              </tr>
            </tbody>
          </table>

          <p class="text-[11px] text-muted-foreground mt-2.5 leading-relaxed">
            Le volume à 15 °C est calculé par le système à partir du volume mesuré, de la température
            et de la densité — jamais ressaisi. C’est la première source d’erreur et de contestation
            avec les distributeurs.
          </p>
        </FormSection>

        <!-- ═══════════════════════════════════════════════════
             6. CONFORMITÉ — écarts et arrêts
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
                <p class="text-xs font-medium text-foreground">{{ a.lieu ?? 'Arrêt' }} — {{ fmtDuree(a.dureeMin) }}</p>
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
                <td class="py-2 text-xs font-mono">{{ d.numero ?? '—' }}</td>
                <td class="py-2 text-xs text-muted-foreground">{{ d.emetteur ?? '—' }}</td>
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
                <td class="py-2 text-xs font-semibold">{{ r.nombreBons ?? '—' }}</td>
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
             9. DÉBRIEFING — reprise de la fiche papier de GTD
             ═══════════════════════════════════════════════════ -->
        <FormSection title="Débriefing au retour" :default-open="false">
          <div class="grid grid-cols-2 gap-x-6 gap-y-4 max-sm:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage départ</label>
              <span class="text-sm text-foreground">{{ item.kmDepart?.toLocaleString('fr-FR') ?? '—' }} km</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage arrivée</label>
              <span class="text-sm text-foreground">{{ item.kmArrivee?.toLocaleString('fr-FR') ?? '—' }} km</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Kilométrage parcouru</label>
              <span class="text-sm text-foreground">{{ km.kmReel != null ? km.kmReel + ' km' : '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Écart au kilométrage de référence</label>
              <span class="text-sm" :class="km.horsTolerance ? 'text-danger font-medium' : 'text-foreground'">
                {{ km.ecartKm != null ? (km.ecartKm > 0 ? '+' : '') + km.ecartKm + ' km (' + km.ecartPct + ' %)' : '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Gain ou coulage</label>
              <span class="text-sm font-semibold" :class="VERDICT[coulage.verdict].text">
                {{ coulage.ecartL != null ? (coulage.ecartL > 0 ? 'Coulage de ' : 'Gain de ') + Math.abs(coulage.ecartL) + ' L' : '—' }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <label :class="F.fieldLabel">Taux d’infraction</label>
              <span class="text-sm text-foreground">{{ ecarts.filter(e => e.nature === 'non_justifiee').length }} infraction(s) retenue(s)</span>
            </div>
          </div>

          <p class="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Reprise de la fiche de débriefing papier utilisée par GTD au retour de chaque voyage.
            Les neuf types d’infraction relevés en séance de débriefing alimentent le score du conducteur.
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
import { AlertTriangle, Octagon } from 'lucide-vue-next'
import CardModalShell from '../shared/CardModalShell.vue'
import FormSection    from '../ui/form-field/FormSection.vue'
import FleetMap       from './FleetMap.vue'
import { useVoyagesStore, LIB_DOC } from '../../stores/voyages'
import { useEcartsStore, LIB_TYPE_ECART, LIB_NATURE } from '../../stores/ecarts'
import { useCarburantStore } from '../../stores/carburant'
import { LIB_ROLE_ETAPE } from '../../types/fms'
import type { Voyage, StatutVoyage, RoleEtape, MapMarker, MapArret } from '../../types/fms'
import type { VerdictCoulage } from '../../lib/fmsUtils'
import {
  calculerCoulageMultiSites, calculerEcartKm,
  fmtDateTime, fmtHeure, fmtDuree, fmtL,
} from '../../lib/fmsUtils'
import * as F from '../../lib/formClasses'

const props = defineProps<{ voyage: Voyage }>()
const emit  = defineEmits<{ close: []; navigate: [id: string] }>()

const store          = useVoyagesStore()
const ecartsStore    = useEcartsStore()
const carburantStore = useCarburantStore()

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
    sublabel: `${LIB_ROLE_ETAPE[e.role]} — ${e.franchi ? 'desservi' : 'manqué'}`,
    color: e.franchi ? '#16a34a' : '#dc2626',
  })))

const arretsCarte = computed<MapArret[]>(() =>
  arrets.value.filter(a => !a.dansSiteDeclare).map(a => ({
    id: a.id, lat: a.lat, lng: a.lng,
    label: a.lieu ?? 'Arrêt', dureeMin: a.dureeMin, justifie: a.justifie,
  })))

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
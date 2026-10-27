package site.stoku.vendas.ui

import android.annotation.SuppressLint
import android.graphics.RectF
import android.os.Build
import android.view.Gravity
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import okhttp3.OkHttpClient
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.geometry.LatLngBounds
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.Style
import org.maplibre.android.module.http.HttpRequestUtil
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.sources.GeoJsonSource
import site.stoku.logjika.Json
import site.stoku.logjika.obj
import site.stoku.vendas.StokuApp

/*
 * Harta e marketeve (harta.js në Android, v256): MapLibre Native me të njëjtin stil si web-i: pllakat vektoriale të
 * OpenFreeMap (vetëm ujë, rrugë pa emra, kufiri dhe EMRAT E VENDBANIMEVE), pikat e marketeve dhe sateliti i Esri-t
 * (ArcGIS, me çelësin publik të faqes, i kufizuar te stoku.site: kërkesat dërgojnë Referer https://stoku.site/).
 * Atribuimi (OpenFreeMap, OpenMapTiles, OpenStreetMap; Esri te sateliti) del te butoni (i), si e kërkon licenca.
 */

/** Një pikë në hartë: k = çelësi (si celesi() te harta.js: "pika|id" ose uid|id) */
data class PikaEHartes(val k: String, val emri: String, val lat: Double?, val lng: Double?, val tjeter: Boolean = false) {
    val kaVend: Boolean get() = lat != null && lng != null && !lat.isNaN() && !lng.isNaN() && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}

object HartaStili {
    const val PLLAKAT = "https://tiles.openfreemap.org/planet"
    const val SHKRONJAT = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"
    val VENDBANIMET = listOf("city", "town", "village", "hamlet", "borough", "suburb", "quarter", "neighbourhood")
    val LAGJET = listOf("borough", "suburb", "quarter", "neighbourhood")
    const val ZOOM_LAGJET = 14.0
    val KOSOVA = LatLng(42.58, 20.9)
    const val KOSOVA_ZOOM = 7.2
    // I njëjti çelës si te harta.js (ArcGIS Location Platform, "Basemaps", i kufizuar te stoku.site): publik si ai i Firebase-it
    const val ESRI_CELESI = "AAPTaOZD6Mj8BN-EAoFrTPLuKQw..HTvVLV3FuQ53XA1Sz6SsxAjRfNAffV3zMJLLqbgP09PHF_OFV134L0YweamGSqSnKitfob0WLVumW2BnAXkDl0d8G0i6Cxvq6EyznpdaOhtSEL1e9IrlvuIJ9bIamV3jrxDFnRwAPF9Cdf4_kapVR1dZf7nACO1oDBgjjQrsyWqF9I9CJqjq8O775kLDHVt7gLDVMvydUYILykbQy9tuGs4MvaFJeHb0-RAJ_cHkOpPjIgI0uk9cdTdVZXUsig..AT1_ScUbQzdT"
    const val SATELITI = "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    const val SATELITI_BURIMI = "Powered by <a href=\"https://www.esri.com/\">Esri</a> | Esri, Vantor, Earthstar Geographics, and the GIS User Community"

    private class Ng(val sfondi: String, val uji: String, val rruga: String, val rrugaKufi: String, val rrugaVogel: String, val kufiri: String,
                     val teksti: String, val tekstiLagje: String, val halo: String, val pika: String, val pikaZgjedhur: String, val pikaKufi: String,
                     val pikaTjeter: String, val tekstiPika: String = "")
    private val CELET = Ng("#f4f2ee", "#c4dcef", "#ffffff", "#d9d4ca", "#ffffff", "#9a8fb0", "#2f3337", "#5b6470", "#ffffff", "#1f6feb", "#e8590c", "#ffffff", "#7a8699")
    private val ERRET = Ng("#1b1e22", "#22394d", "#3b4048", "#2a2e34", "#30343a", "#7d7396", "#e7e9ec", "#aab2bd", "#1b1e22", "#4c9bff", "#ff8a3d", "#1b1e22", "#8d99ab")
    private val SATELIT = Ng("", "", "", "", "", "#ffffff", "#ffffff", "#e6e9ee", "rgba(0,0,0,0.85)", "#4c9bff", "#ff8a3d", "#ffffff", "#c3ccd8", "#ffffff")

    private fun zgj(k: String): List<Any?> = listOf("==", listOf("get", "k"), k)
    private fun ngjyraEPikes(n: Ng, k: String): List<Any?> = listOf("case", zgj(k), n.pikaZgjedhur, listOf("==", listOf("get", "tjeter"), true), n.pikaTjeter, n.pika)
    private fun rrezja(k: String): List<Any?> = listOf("interpolate", listOf("linear"), listOf("zoom"), 6, listOf("case", zgj(k), 7, 5), 14, listOf("case", zgj(k), 12, 9))
    private fun renditja(k: String): List<Any?> = listOf("case", zgj(k), 0, listOf("==", listOf("get", "tjeter"), true), 2, 1)

    /** Stili (si stili() te harta.js) si JSON */
    fun stili(erret: Boolean, satelit: Boolean, zgjedhur: String, pikat: List<PikaEHartes>): String {
        val n = if (erret) ERRET else CELET
        val ns = if (satelit) SATELIT else n
        val rruget = listOf("in", listOf("get", "class"), listOf("literal", listOf("motorway", "trunk", "primary", "secondary", "tertiary")))
        val vis = if (satelit) "none" else "visible"
        val burimet = obj(
            "omt" to obj("type" to "vector", "url" to PLLAKAT),
            "pikat" to obj("type" to "geojson", "data" to geoJsonObj(pikat)),
            "satelit" to obj("type" to "raster", "tiles" to listOf(SATELITI + "?token=" + java.net.URLEncoder.encode(ESRI_CELESI, "UTF-8")), "tileSize" to 256, "maxzoom" to 19, "attribution" to SATELITI_BURIMI)
        )
        val shtresat = listOf(
            obj("id" to "sfondi", "type" to "background", "paint" to obj("background-color" to n.sfondi)),
            obj("id" to "satelit", "type" to "raster", "source" to "satelit", "layout" to obj("visibility" to if (satelit) "visible" else "none")),
            obj("id" to "uji", "type" to "fill", "source" to "omt", "source-layer" to "water", "layout" to obj("visibility" to vis), "paint" to obj("fill-color" to n.uji)),
            obj("id" to "lumenjte", "type" to "line", "source" to "omt", "source-layer" to "waterway", "minzoom" to 9, "layout" to obj("visibility" to vis),
                "paint" to obj("line-color" to n.uji, "line-width" to 1.2)),
            obj("id" to "rruget-vogla", "type" to "line", "source" to "omt", "source-layer" to "transportation", "minzoom" to 13, "layout" to obj("visibility" to vis),
                "filter" to listOf("in", listOf("get", "class"), listOf("literal", listOf("minor", "service"))),
                "paint" to obj("line-color" to n.rrugaVogel, "line-width" to listOf("interpolate", listOf("linear"), listOf("zoom"), 13, 1, 17, 6))),
            obj("id" to "rruget-kufi", "type" to "line", "source" to "omt", "source-layer" to "transportation", "minzoom" to 6, "filter" to rruget,
                "layout" to obj("line-cap" to "round", "line-join" to "round", "visibility" to vis),
                "paint" to obj("line-color" to n.rrugaKufi, "line-width" to listOf("interpolate", listOf("linear"), listOf("zoom"), 6, 1.5, 12, 4, 17, 14))),
            obj("id" to "rruget", "type" to "line", "source" to "omt", "source-layer" to "transportation", "minzoom" to 6, "filter" to rruget,
                "layout" to obj("line-cap" to "round", "line-join" to "round", "visibility" to vis),
                "paint" to obj("line-color" to n.rruga, "line-width" to listOf("interpolate", listOf("linear"), listOf("zoom"), 6, 0.6, 12, 2.5, 17, 11))),
            obj("id" to "kufiri", "type" to "line", "source" to "omt", "source-layer" to "boundary",
                "filter" to listOf("all", listOf("<=", listOf("get", "admin_level"), 2), listOf("!=", listOf("get", "maritime"), 1)),
                "paint" to obj("line-color" to ns.kufiri, "line-width" to 1.2, "line-dasharray" to listOf(3, 2))),
            // Emrat: VETËM vendbanimet (qytet, qytezë, fshat, lagje)
            obj("id" to "vendbanimet", "type" to "symbol", "source" to "omt", "source-layer" to "place",
                "filter" to listOf("in", listOf("get", "class"), listOf("literal", VENDBANIMET)),
                "layout" to obj("text-field" to listOf("coalesce", listOf("get", "name:sq"), listOf("get", "name")), "text-font" to listOf("Noto Sans Regular"), "text-max-width" to 8,
                    "text-size" to listOf("match", listOf("get", "class"), "city", 16, "town", 14, "village", 12.5, LAGJET, 11, 11.5),
                    "text-transform" to listOf("match", listOf("get", "class"), LAGJET, "uppercase", "none"),
                    "text-letter-spacing" to listOf("match", listOf("get", "class"), LAGJET, 0.08, 0),
                    "symbol-sort-key" to listOf("coalesce", listOf("get", "rank"), 99)),
                "paint" to obj("text-color" to listOf("match", listOf("get", "class"), LAGJET, ns.tekstiLagje, ns.teksti), "text-halo-color" to ns.halo,
                    "text-halo-width" to if (satelit) 1.8 else 1.5)),
            obj("id" to "pikat", "type" to "circle", "source" to "pikat",
                "paint" to obj("circle-radius" to rrezja(zgjedhur), "circle-color" to ngjyraEPikes(ns, zgjedhur), "circle-stroke-color" to ns.pikaKufi, "circle-stroke-width" to 2.5)),
            obj("id" to "pikat-emri", "type" to "symbol", "source" to "pikat",
                "layout" to obj("text-field" to listOf("get", "emri"), "text-font" to listOf("Noto Sans Bold"), "text-size" to 13, "text-anchor" to "top",
                    "text-offset" to listOf(0, 0.9), "text-max-width" to 10, "symbol-sort-key" to renditja(zgjedhur)),
                "paint" to obj("text-color" to (if (satelit) ns.tekstiPika else ngjyraEPikes(ns, zgjedhur)), "text-halo-color" to ns.halo, "text-halo-width" to 1.8))
        )
        return Json.shkruaj(obj("version" to 8, "glyphs" to SHKRONJAT, "sources" to burimet, "layers" to shtresat))
    }

    private fun geoJsonObj(pikat: List<PikaEHartes>) = obj("type" to "FeatureCollection", "features" to pikat.filter { it.kaVend }.map { p ->
        obj("type" to "Feature", "geometry" to obj("type" to "Point", "coordinates" to listOf(p.lng, p.lat)),
            "properties" to obj("k" to p.k, "emri" to p.emri.ifEmpty { "Market" }, "tjeter" to p.tjeter))
    })
    fun geoJson(pikat: List<PikaEHartes>): String = Json.shkruaj(geoJsonObj(pikat))

    /** Pjesët e stilit që ndryshojnë me zgjedhjen (si zgjidh() te harta.js) */
    fun ngjyraJson(erret: Boolean, satelit: Boolean, k: String): String = Json.shkruaj(ngjyraEPikes(if (satelit) SATELIT else if (erret) ERRET else CELET, k))
    fun rrezjaJson(k: String): String = Json.shkruaj(rrezja(k))
    fun renditjaJson(k: String): String = Json.shkruaj(renditja(k))
}

/** Lidhja me hartën nga faqja (qendra për "+ Shto market në hartë", përshtatja te pikat) */
class HartaKontrolli {
    internal var map: MapLibreMap? = null
    /** Qendra e hartës dhe zmadhimi, ose null kur harta s'është gati */
    fun qendra(): Triple<Double, Double, Double>? {
        val m = map ?: return null
        val t = m.cameraPosition.target ?: return null
        return Triple(t.latitude, t.longitude, m.cameraPosition.zoom)
    }
    /** Si pershtat() te harta.js: krejt pikat në pamje (një pikë: zmadhimi 14; asnjë: Kosova) */
    fun pershtat(pikat: List<PikaEHartes>) {
        val m = map ?: return
        val v = pikat.filter { it.kaVend }
        try {
            when (v.size) {
                0 -> m.moveCamera(CameraUpdateFactory.newLatLngZoom(HartaStili.KOSOVA, HartaStili.KOSOVA_ZOOM))
                1 -> m.moveCamera(CameraUpdateFactory.newLatLngZoom(LatLng(v[0].lat!!, v[0].lng!!), 14.0))
                else -> {
                    m.moveCamera(CameraUpdateFactory.newLatLngBounds(LatLngBounds.Builder().includes(v.map { LatLng(it.lat!!, it.lng!!) }).build(), 120))
                    if (m.cameraPosition.zoom > 15) m.moveCamera(CameraUpdateFactory.zoomTo(15.0))
                }
            }
        } catch (e: Exception) { }
    }
    fun fluturo(p: PikaEHartes?) {
        val m = map ?: return
        if (p == null || !p.kaVend) return
        try { m.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(p.lat!!, p.lng!!), maxOf(m.cameraPosition.zoom, 15.0)), 600) } catch (e: Exception) { }
    }
}

private object HartaNisja {
    private var gati = false
    /** MapLibre + OkHttp me Referer-in e faqes për satelitin (çelësi i Esri-t pranon vetëm stoku.site) */
    fun nis(ctx: android.content.Context) {
        if (gati) return
        gati = true
        MapLibre.getInstance(ctx.applicationContext)
        try {
            HttpRequestUtil.setOkHttpClient(OkHttpClient.Builder().addInterceptor { ch ->
                val k = ch.request()
                ch.proceed(if (k.url.host.endsWith("arcgis.com")) k.newBuilder().header("Referer", "https://stoku.site/").build() else k)
            }.build())
        } catch (e: Throwable) { }
    }
}

/** Testet e pamjeve (Robolectric) s'kanë OpenGL: aty del vetëm vendi i hartës */
private val neProve: Boolean get() = Build.FINGERPRINT == "robolectric"

/**
 * Harta (si .ht-harta te web-i): zmadho / zvogëlo, "Satelit" / "Hartë", "Zmadho për emrat e lagjeve", shenja në mes
 * (administratori vendos një market të ri) dhe prekja e një pike (kurKlikon me çelësin e saj).
 */
@SuppressLint("ClickableViewAccessibility")
@Composable
fun HartaEMarketeve(pikat: List<PikaEHartes>, zgjedhur: String, shenjestra: Boolean, kontrolli: HartaKontrolli,
                    kurKlikon: (String) -> Unit, modifier: Modifier = Modifier, lartesia: Dp = 380.dp) {
    val n = N
    val forma = RoundedCornerShape(16.dp)
    val baza = modifier.fillMaxWidth().height(lartesia).clip(forma).background(n.surface2).border(1.dp, n.line, forma)
    if (neProve) {
        Box(baza, contentAlignment = Alignment.Center) {
            Text("Harta e marketeve", style = tx(13, 600, n.muted), textAlign = TextAlign.Center)
        }
        return
    }
    val ctx = LocalContext.current
    val erret = n.erret
    var satelit by remember { mutableStateOf(StokuApp.prefsOseB("harta_satelit", false)) }
    var zoom by remember { mutableDoubleStateOf(HartaStili.KOSOVA_ZOOM) }
    var gabim by remember { mutableStateOf("") }
    var stiliGati by remember { mutableStateOf(false) }
    var pershtatur by remember { mutableStateOf(false) }
    val pikatTani by rememberUpdatedState(pikat)
    val kurKlikonTani by rememberUpdatedState(kurKlikon)
    val zgjedhurTani by rememberUpdatedState(zgjedhur)
    val mapView = remember {
        HartaNisja.nis(ctx)
        MapView(ctx).also { mv ->
            mv.onCreate(null)
            mv.addOnDidFailLoadingMapListener { gabim = "Harta s'u hap. Kontrollo internetin dhe provo sërish." }
            // Brenda faqes që lëviz: harta i merr vetë lëvizjet e gishtit
            mv.setOnTouchListener { v, _ -> v.parent?.requestDisallowInterceptTouchEvent(true); false }
        }
    }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, mapView) {
        val obs = LifecycleEventObserver { _, e ->
            when (e) {
                Lifecycle.Event.ON_START -> mapView.onStart()
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                Lifecycle.Event.ON_STOP -> mapView.onStop()
                else -> {}
            }
        }
        lifecycle.addObserver(obs)
        onDispose {
            lifecycle.removeObserver(obs)
            kontrolli.map = null
            try { mapView.onPause(); mapView.onStop(); mapView.onDestroy() } catch (e: Exception) { }
        }
    }
    // Harta gati: kontrollet dhe prekja e pikave
    LaunchedEffect(mapView) {
        mapView.getMapAsync { m ->
            kontrolli.map = m
            m.uiSettings.isRotateGesturesEnabled = false
            m.uiSettings.isTiltGesturesEnabled = false
            m.uiSettings.isCompassEnabled = false
            m.uiSettings.isLogoEnabled = false
            m.uiSettings.isAttributionEnabled = true
            m.uiSettings.attributionGravity = Gravity.BOTTOM or Gravity.END
            m.setMaxZoomPreference(18.0)
            m.moveCamera(CameraUpdateFactory.newLatLngZoom(HartaStili.KOSOVA, HartaStili.KOSOVA_ZOOM))
            m.addOnCameraIdleListener { zoom = m.cameraPosition.zoom }
            m.addOnMapClickListener { ll ->
                val p = m.projection.toScreenLocation(ll)
                val r = 22f * ctx.resources.displayMetrics.density
                val f = try { m.queryRenderedFeatures(RectF(p.x - r, p.y - r, p.x + r, p.y + r), "pikat") } catch (e: Exception) { emptyList() }
                val k = f.firstOrNull()?.getStringProperty("k")
                if (k != null) { kurKlikonTani(k); true } else false
            }
        }
    }
    // Stili (ngarkohet sërish kur ndryshon tema ose sateliti)
    LaunchedEffect(mapView, erret, satelit) {
        mapView.getMapAsync { m ->
            stiliGati = false
            m.setStyle(Style.Builder().fromJson(HartaStili.stili(erret, satelit, zgjedhurTani, pikatTani))) {
                stiliGati = true
                if (!pershtatur) { pershtatur = true; kontrolli.pershtat(pikatTani) }
            }
        }
    }
    // Pikat (vijnë më vonë nga Firebase): burimi rifreskohet; herën e parë harta përshtatet te to
    LaunchedEffect(pikat, stiliGati) {
        if (!stiliGati) return@LaunchedEffect
        val m = kontrolli.map ?: return@LaunchedEffect
        m.style?.getSourceAs<GeoJsonSource>("pikat")?.setGeoJson(HartaStili.geoJson(pikat))
        if (pikat.any { it.kaVend } && !pershtatur) { pershtatur = true; kontrolli.pershtat(pikat) }
    }
    // Zgjedhja: pika portokalli dhe më e madhe
    LaunchedEffect(zgjedhur, stiliGati) {
        if (!stiliGati) return@LaunchedEffect
        val st = kontrolli.map?.style ?: return@LaunchedEffect
        try {
            st.getLayerAs<CircleLayer>("pikat")?.setProperties(PropertyFactory.circleColor(Expression.raw(HartaStili.ngjyraJson(erret, satelit, zgjedhur))),
                PropertyFactory.circleRadius(Expression.raw(HartaStili.rrezjaJson(zgjedhur))))
            st.getLayerAs<SymbolLayer>("pikat-emri")?.setProperties(PropertyFactory.symbolSortKey(Expression.raw(HartaStili.renditjaJson(zgjedhur))))
            if (!satelit) st.getLayerAs<SymbolLayer>("pikat-emri")?.setProperties(PropertyFactory.textColor(Expression.raw(HartaStili.ngjyraJson(erret, false, zgjedhur))))
        } catch (e: Exception) { }
    }

    Box(baza) {
        AndroidView({ mapView }, Modifier.fillMaxSize())
        // Lart majtas: nën zmadhimin 14 pllakat s'i kanë lagjet
        if (zoom < HartaStili.ZOOM_LAGJET - 0.05 && gabim.isEmpty())
            Text("Zmadho për emrat e lagjeve", style = tx(13, 600, n.ink), modifier = Modifier.align(Alignment.TopStart).padding(10.dp)
                .shadow(2.dp, RoundedCornerShape(50)).clip(RoundedCornerShape(50)).background(n.surface)
                .clickable { kontrolli.map?.animateCamera(CameraUpdateFactory.zoomTo(HartaStili.ZOOM_LAGJET), 500) }.padding(horizontal = 12.dp, vertical = 7.dp))
        // Lart djathtas: zmadho / zvogëlo, pastaj "Satelit" / "Hartë"
        Column(Modifier.align(Alignment.TopEnd).padding(10.dp), horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Column(Modifier.shadow(2.dp, RoundedCornerShape(8.dp)).clip(RoundedCornerShape(8.dp)).background(n.surface)) {
                ButoniIHartes("+", "Zmadho") { kontrolli.map?.animateCamera(CameraUpdateFactory.zoomIn(), 250) }
                Box(Modifier.size(width = 36.dp, height = 1.dp).background(n.line))
                ButoniIHartes("−", "Zvogëlo") { kontrolli.map?.animateCamera(CameraUpdateFactory.zoomOut(), 250) }
            }
            Text(if (satelit) "Hartë" else "Satelit", style = tx(13, 700, n.ink), modifier = Modifier.shadow(2.dp, RoundedCornerShape(8.dp)).clip(RoundedCornerShape(8.dp))
                .background(n.surface).clickable { satelit = !satelit; StokuApp.vendosPrefB("harta_satelit", satelit) }.padding(horizontal = 12.dp, vertical = 8.dp))
        }
        // Shenja në mes: vendi i marketit të ri (administratori)
        if (shenjestra) Icon(Ik.Vendi, null, Modifier.align(Alignment.Center).offset(y = (-17).dp).size(34.dp), tint = n.accent)
        if (satelit) Text("Powered by Esri", style = tx(10, 600, Color.White), modifier = Modifier.align(Alignment.BottomStart).padding(6.dp)
            .clip(RoundedCornerShape(4.dp)).background(Color(0x99000000)).padding(horizontal = 6.dp, vertical = 2.dp))
        if (gabim.isNotEmpty()) Box(Modifier.fillMaxSize().background(n.surface2).padding(20.dp), contentAlignment = Alignment.Center) {
            Text(gabim, style = txR(13.5f, 500, n.muted), textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun ButoniIHartes(teksti: String, pershkrimi: String, onClick: () -> Unit) {
    Box(Modifier.size(36.dp).semantics { contentDescription = pershkrimi }.clickable(onClick = onClick), contentAlignment = Alignment.Center) {
        Text(teksti, style = tx(20, 500, N.ink))
    }
}

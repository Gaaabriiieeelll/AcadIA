package br.edu.ifpb.acadia

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import br.edu.ifpb.acadia.widget.ConnectionStore
import br.edu.ifpb.acadia.widget.WidgetApi
import br.edu.ifpb.acadia.widget.WidgetConnection
import br.edu.ifpb.acadia.widget.WidgetSyncScheduler
import java.net.URI
import java.security.SecureRandom

class MainActivity : Activity() {
    private lateinit var codeInput: EditText
    private lateinit var connectButton: Button
    private lateinit var serverInput: EditText
    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildInterface()
        applyPairingLink(intent.data)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        applyPairingLink(intent.data)
    }

    private fun buildInterface() {
        val padding = dp(24)
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(padding, padding, padding, padding)
        }
        content.addView(label("AcadIA", 28f, true))
        content.addView(label("Widget de compromissos em aberto", 18f, true).withTop(dp(8)))
        content.addView(
            label(
                "No AcadIA, abra Calendário, gere um código para o Android e informe os dados abaixo. A conexão usa HTTPS e o token fica criptografado neste aparelho.",
                14f,
                false,
            ).withTop(dp(10)),
        )

        serverInput = EditText(this).apply {
            hint = "https://endereco-do-acadia"
            setText(ConnectionStore.connection(this@MainActivity)?.serverUrl ?: BuildConfig.ACADIA_BASE_URL)
            inputType = android.text.InputType.TYPE_TEXT_VARIATION_URI
        }
        content.addView(fieldLabel("Endereço do AcadIA").withTop(dp(22)))
        content.addView(serverInput, matchWrap())

        codeInput = EditText(this).apply {
            hint = "ABCD-EFGH"
            inputType = android.text.InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS
        }
        content.addView(fieldLabel("Código temporário").withTop(dp(14)))
        content.addView(codeInput, matchWrap())

        connectButton = Button(this).apply {
            text = "Conectar widget"
            setOnClickListener { connect() }
        }
        content.addView(connectButton, matchWrap().withTop(dp(18)))

        statusText = label("", 13f, false).apply { setTextColor(Color.rgb(18, 107, 53)) }
        content.addView(statusText, matchWrap().withTop(dp(12)))

        val openButton = Button(this).apply {
            text = "Abrir AcadIA"
            setOnClickListener {
                validatedServerUrl()?.let { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(it))) }
            }
        }
        content.addView(openButton, matchWrap().withTop(dp(24)))

        val resetButton = Button(this).apply {
            text = "Desconectar este celular"
            setOnClickListener {
                ConnectionStore.clear(this@MainActivity)
                statusText.text = "Conexão local removida. Revogue também o aparelho no AcadIA."
                WidgetSyncScheduler.refresh(this@MainActivity)
            }
        }
        content.addView(resetButton, matchWrap().withTop(dp(8)))

        setContentView(ScrollView(this).apply { addView(content) })
        if (ConnectionStore.connection(this) != null) {
            statusText.text = "Celular conectado. Adicione “AcadIA · Em aberto” à tela inicial."
        }
    }

    private fun applyPairingLink(uri: Uri?) {
        if (uri?.scheme != "acadia" || uri.host != "pair") return
        uri.getQueryParameter("server")?.let(serverInput::setText)
        uri.getQueryParameter("code")?.let(codeInput::setText)
        if (!codeInput.text.isNullOrBlank()) connect()
    }

    private fun connect() {
        val serverUrl = validatedServerUrl() ?: return
        val code = codeInput.text.toString().trim().uppercase()
        if (!Regex("^[A-Z2-9]{4}-?[A-Z2-9]{4}$").matches(code)) {
            statusText.text = "Informe o código de oito caracteres exibido pelo AcadIA."
            return
        }
        val tokenBytes = ByteArray(32).also(SecureRandom()::nextBytes)
        val token = Base64.encodeToString(
            tokenBytes,
            Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP,
        )
        connectButton.isEnabled = false
        statusText.text = "Conectando…"
        Thread {
            runCatching {
                WidgetApi.pair(serverUrl, code, token, Build.MODEL.take(80))
                ConnectionStore.saveConnection(this, WidgetConnection(serverUrl, token))
                WidgetSyncScheduler.schedule(this)
            }.onSuccess {
                runOnUiThread {
                    connectButton.isEnabled = true
                    statusText.text = "Conectado. Agora adicione o widget AcadIA à tela inicial."
                }
            }.onFailure { error ->
                runOnUiThread {
                    connectButton.isEnabled = true
                    statusText.text = error.message ?: "Não foi possível conectar."
                }
            }
        }.start()
    }

    private fun validatedServerUrl(): String? {
        val value = serverInput.text.toString().trim().trimEnd('/')
        val uri = runCatching { URI(value) }.getOrNull()
        val validScheme = uri?.scheme == "https" || (BuildConfig.DEBUG && uri?.scheme == "http")
        if (!validScheme || uri?.host.isNullOrBlank()) {
            statusText.text = if (BuildConfig.DEBUG) {
                "Informe um endereço HTTP ou HTTPS válido."
            } else {
                "Por segurança, informe um endereço HTTPS válido."
            }
            return null
        }
        return value
    }

    private fun label(text: String, size: Float, bold: Boolean) = TextView(this).apply {
        this.text = text
        textSize = size
        setTextColor(Color.rgb(18, 53, 43))
        if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    private fun fieldLabel(text: String) = label(text, 12f, true)

    private fun matchWrap() = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
    )

    private fun LinearLayout.LayoutParams.withTop(value: Int) = apply { topMargin = value }

    private fun <T : TextView> T.withTop(value: Int): T = apply {
        layoutParams = matchWrap().withTop(value)
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}

package br.edu.ifpb.acadia.widget

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object ConnectionStore {
    private const val ALIAS = "acadia_widget_credentials_v1"
    private const val CACHE = "commitment_cache"
    private const val PREFS = "acadia_widget"
    private const val SERVER = "server_url"
    private const val TOKEN = "access_token"

    private fun preferences(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun secretKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (keyStore.getKey(ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(
                ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build(),
        )
        return generator.generateKey()
    }

    private fun encrypt(value: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val payload = cipher.iv + cipher.doFinal(value.toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(payload, Base64.NO_WRAP)
    }

    private fun decrypt(value: String): String? = runCatching {
        val payload = Base64.decode(value, Base64.NO_WRAP)
        if (payload.size <= 12) return null
        val iv = payload.copyOfRange(0, 12)
        val encrypted = payload.copyOfRange(12, payload.size)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(128, iv))
        String(cipher.doFinal(encrypted), Charsets.UTF_8)
    }.getOrNull()

    fun saveConnection(context: Context, connection: WidgetConnection) {
        preferences(context).edit()
            .putString(SERVER, connection.serverUrl)
            .putString(TOKEN, encrypt(connection.token))
            .remove(CACHE)
            .apply()
    }

    fun connection(context: Context): WidgetConnection? {
        val prefs = preferences(context)
        val serverUrl = prefs.getString(SERVER, null) ?: return null
        val token = prefs.getString(TOKEN, null)?.let(::decrypt) ?: return null
        return WidgetConnection(serverUrl, token)
    }

    fun saveCommitments(context: Context, payload: String) {
        preferences(context).edit().putString(CACHE, encrypt(payload)).apply()
    }

    fun commitments(context: Context): List<OpenCommitment> {
        val payload = preferences(context).getString(CACHE, null)?.let(::decrypt) ?: return emptyList()
        return WidgetApi.parseCommitments(payload)
    }

    fun clear(context: Context) {
        preferences(context).edit().clear().apply()
    }
}

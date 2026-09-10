package br.edu.ifpb.acadia.widget

import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

object WidgetApi {
    class UnauthorizedException : IOException("Conexão revogada. Pareie o celular novamente.")

    private fun connection(url: String) = (URL(url).openConnection() as HttpURLConnection).apply {
        connectTimeout = 12_000
        readTimeout = 12_000
        useCaches = false
        setRequestProperty("Accept", "application/json")
        setRequestProperty("User-Agent", "AcadIA-Android-Widget/0.1")
    }

    fun pair(serverUrl: String, code: String, token: String, deviceName: String) {
        val request = connection("$serverUrl/api/android-widget/pair").apply {
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
        }
        val body = JSONObject()
            .put("code", code)
            .put("token", token)
            .put("deviceName", deviceName)
            .toString()
        request.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        val status = request.responseCode
        request.disconnect()
        if (status == 409) throw IOException("Código inválido, expirado ou já utilizado.")
        if (status !in 200..299) throw IOException("O AcadIA não aceitou a conexão ($status).")
    }

    fun fetchCommitments(connection: WidgetConnection): String {
        val request = connection("${connection.serverUrl}/api/android-widget/events").apply {
            requestMethod = "GET"
            setRequestProperty("Authorization", "Bearer ${connection.token}")
        }
        val status = request.responseCode
        if (status == 401) {
            request.disconnect()
            throw UnauthorizedException()
        }
        if (status !in 200..299) {
            request.disconnect()
            throw IOException("Falha ao atualizar compromissos ($status).")
        }
        val payload = request.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        request.disconnect()
        parseCommitments(payload)
        return payload
    }

    fun parseCommitments(payload: String): List<OpenCommitment> = runCatching {
        val items = JSONObject(payload).getJSONArray("commitments")
        buildList {
            for (index in 0 until items.length()) {
                val item = items.getJSONObject(index)
                add(
                    OpenCommitment(
                        id = item.getString("id"),
                        title = item.getString("title"),
                        startDate = item.getString("startDate"),
                        startTime = item.optString("startTime").ifBlank { null },
                        subjectName = item.optString("subjectName").ifBlank { null },
                        color = item.optString("color", "#16833F"),
                        href = item.getString("href"),
                    ),
                )
            }
        }
    }.getOrElse { emptyList() }
}

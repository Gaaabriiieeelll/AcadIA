package br.edu.ifpb.acadia.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.defaultWeight
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import br.edu.ifpb.acadia.MainActivity
import br.edu.ifpb.acadia.R
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

class AcadiaWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val connection = ConnectionStore.connection(context)
        val commitments = ConnectionStore.commitments(context)
        provideContent {
            WidgetContent(connection, commitments)
        }
    }
}

@Composable
private fun WidgetContent(
    connection: WidgetConnection?,
    commitments: List<OpenCommitment>,
) {
    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .appWidgetBackground()
            .background(ColorProvider(R.color.acadia_surface))
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                provider = ImageProvider(R.drawable.ic_acadia),
                contentDescription = null,
                modifier = GlanceModifier.size(28.dp),
            )
            Spacer(GlanceModifier.width(8.dp))
            Text(
                text = "AcadIA · Em aberto",
                style = TextStyle(
                    color = ColorProvider(R.color.acadia_green_dark),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                ),
            )
        }
        Spacer(GlanceModifier.height(9.dp))

        when {
            connection == null -> ConnectionMessage()
            commitments.isEmpty() -> EmptyMessage(connection)
            else -> {
                commitments.take(3).forEach { commitment ->
                    CommitmentRow(connection, commitment)
                    Spacer(GlanceModifier.height(6.dp))
                }
                if (commitments.size > 3) {
                    Text(
                        text = "+${commitments.size - 3} compromisso(s) no AcadIA",
                        style = TextStyle(
                            color = ColorProvider(R.color.acadia_muted),
                            fontSize = 10.sp,
                        ),
                    )
                }
            }
        }
    }
}

@Composable
private fun ConnectionMessage() {
    val intent = Intent(Intent.ACTION_MAIN).apply {
        setClassName("br.edu.ifpb.acadia", MainActivity::class.java.name)
    }
    Column(
        modifier = GlanceModifier
            .fillMaxWidth()
            .clickable(actionStartActivity(intent)),
    ) {
        Text(
            text = "Conecte este celular",
            style = TextStyle(
                color = ColorProvider(R.color.acadia_text),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
            ),
        )
        Text(
            text = "Toque aqui e use o código criado no calendário do AcadIA.",
            style = TextStyle(color = ColorProvider(R.color.acadia_muted), fontSize = 10.sp),
            maxLines = 2,
        )
    }
}

@Composable
private fun EmptyMessage(connection: WidgetConnection) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("${connection.serverUrl}/calendario"))
    Column(
        modifier = GlanceModifier
            .fillMaxWidth()
            .clickable(actionStartActivity(intent)),
    ) {
        Text(
            text = "Tudo em dia",
            style = TextStyle(
                color = ColorProvider(R.color.acadia_text),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
            ),
        )
        Text(
            text = "Nenhum compromisso em aberto. Toque para abrir o calendário.",
            style = TextStyle(color = ColorProvider(R.color.acadia_muted), fontSize = 10.sp),
            maxLines = 2,
        )
    }
}

@Composable
private fun CommitmentRow(
    connection: WidgetConnection,
    commitment: OpenCommitment,
) {
    val intent = Intent(
        Intent.ACTION_VIEW,
        Uri.parse("${connection.serverUrl}${commitment.href}"),
    )
    Row(
        modifier = GlanceModifier
            .fillMaxWidth()
            .background(ColorProvider(R.color.acadia_green_soft))
            .padding(horizontal = 9.dp, vertical = 7.dp)
            .clickable(actionStartActivity(intent)),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = GlanceModifier.defaultWeight()) {
            Text(
                text = commitment.title,
                style = TextStyle(
                    color = ColorProvider(R.color.acadia_text),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                ),
                maxLines = 1,
            )
            Text(
                text = commitmentLabel(commitment),
                style = TextStyle(color = ColorProvider(R.color.acadia_muted), fontSize = 9.sp),
                maxLines = 1,
            )
        }
    }
}

private fun commitmentLabel(commitment: OpenCommitment): String {
    val today = LocalDate.now(ZoneId.of("America/Sao_Paulo"))
    val start = runCatching { LocalDate.parse(commitment.startDate) }.getOrElse { today }
    val days = ChronoUnit.DAYS.between(start, today)
    val timing = when {
        days > 1 -> "aberto há $days dias"
        days == 1L -> "aberto há 1 dia"
        days == 0L -> "inicia hoje"
        days == -1L -> "inicia amanhã"
        else -> "inicia em ${-days} dias"
    }
    val subject = commitment.subjectName?.let { "$it · " } ?: ""
    val time = commitment.startTime?.let { " · $it" } ?: ""
    return "$subject$timing$time"
}

class AcadiaWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = AcadiaWidget()

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        WidgetSyncScheduler.schedule(context)
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        super.onUpdate(context, appWidgetManager, appWidgetIds)
        WidgetSyncScheduler.refresh(context)
    }
}

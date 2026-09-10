package br.edu.ifpb.acadia.widget

import android.content.Context
import androidx.glance.appwidget.updateAll
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.io.IOException
import java.util.concurrent.TimeUnit

class WidgetSyncWorker(
    context: Context,
    parameters: WorkerParameters,
) : CoroutineWorker(context, parameters) {
    override suspend fun doWork(): Result {
        val connection = ConnectionStore.connection(applicationContext) ?: return Result.success()
        return try {
            val payload = WidgetApi.fetchCommitments(connection)
            ConnectionStore.saveCommitments(applicationContext, payload)
            AcadiaWidget().updateAll(applicationContext)
            Result.success()
        } catch (_: WidgetApi.UnauthorizedException) {
            ConnectionStore.clear(applicationContext)
            AcadiaWidget().updateAll(applicationContext)
            Result.failure()
        } catch (_: IOException) {
            Result.retry()
        }
    }
}

object WidgetSyncScheduler {
    private const val PERIODIC_WORK = "acadia-widget-periodic-sync"
    private const val REFRESH_WORK = "acadia-widget-refresh"

    private val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    fun schedule(context: Context) {
        val request = PeriodicWorkRequestBuilder<WidgetSyncWorker>(30, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            PERIODIC_WORK,
            ExistingPeriodicWorkPolicy.UPDATE,
            request,
        )
        refresh(context)
    }

    fun refresh(context: Context) {
        val request = OneTimeWorkRequestBuilder<WidgetSyncWorker>()
            .setConstraints(constraints)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            REFRESH_WORK,
            ExistingWorkPolicy.REPLACE,
            request,
        )
    }
}

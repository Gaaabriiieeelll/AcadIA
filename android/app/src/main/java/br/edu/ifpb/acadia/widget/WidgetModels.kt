package br.edu.ifpb.acadia.widget

data class WidgetConnection(
    val serverUrl: String,
    val token: String,
)

data class OpenCommitment(
    val id: String,
    val title: String,
    val startDate: String,
    val startTime: String?,
    val subjectName: String?,
    val color: String,
    val href: String,
)

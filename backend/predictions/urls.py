from django.urls import path
from .views import (
    UploadPredictView,
    BatchListView,
    BatchDetailView,
    DownloadReportView,
    DownloadTemplateView,
    ModelMetricsView,
    ExplainView,
)

urlpatterns = [
    # Upload Excel file and get predictions
    path('upload/', UploadPredictView.as_view(), name='upload-predict'),

    # List all previous upload batches
    path('batches/', BatchListView.as_view(), name='batch-list'),

    # Get single batch details with all customer predictions
    path('batches/<int:batch_id>/', BatchDetailView.as_view(), name='batch-detail'),

    # Download colored Excel report for a batch
    path('batches/<int:batch_id>/download/', DownloadReportView.as_view(), name='download-report'),

    # Download blank template for bank staff
    path('template/', DownloadTemplateView.as_view(), name='download-template'),

    # Get model accuracy metrics
    path('metrics/', ModelMetricsView.as_view(), name='model-metrics'),
    
    path('explain/<int:batch_id>/<int:row_index>/', ExplainView.as_view(), name='explain'),
]
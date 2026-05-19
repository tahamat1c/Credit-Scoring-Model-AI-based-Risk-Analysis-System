from django.db import models

class PredictionBatch(models.Model):
    """
    Stores each uploaded file and its batch prediction results.
    One record per uploaded Excel/CSV file.
    """
    file_name      = models.CharField(max_length=255)
    uploaded_at    = models.DateTimeField(auto_now_add=True)
    total_customers = models.IntegerField(default=0)
    low_risk_count  = models.IntegerField(default=0)
    medium_risk_count = models.IntegerField(default=0)
    high_risk_count  = models.IntegerField(default=0)
    status         = models.CharField(
        max_length=20,
        choices=[('processing', 'Processing'), ('done', 'Done'), ('failed', 'Failed')],
        default='processing'
    )

    def __str__(self):
        return f"{self.file_name} — {self.uploaded_at.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-uploaded_at']


class CustomerPrediction(models.Model):
    """
    Stores individual customer prediction results.
    Many records per PredictionBatch.
    """
    RISK_CHOICES = [
        ('Low Risk',    'Low Risk'),
        ('Medium Risk', 'Medium Risk'),
        ('High Risk',   'High Risk'),
    ]

    batch           = models.ForeignKey(
        PredictionBatch,
        on_delete=models.CASCADE,
        related_name='customers'
    )
    row_index       = models.IntegerField()
    name        = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=20, null=True, blank=True)
    
    # Raw customer data stored as individual fields
    checking_status     = models.CharField(max_length=50,  blank=True, null=True)
    duration            = models.FloatField(blank=True, null=True)
    credit_history      = models.CharField(max_length=100, blank=True, null=True)
    purpose             = models.CharField(max_length=100, blank=True, null=True)
    credit_amount       = models.FloatField(blank=True, null=True)
    savings_status      = models.CharField(max_length=50,  blank=True, null=True)
    employment          = models.CharField(max_length=50,  blank=True, null=True)
    installment_commitment = models.FloatField(blank=True, null=True)
    personal_status     = models.CharField(max_length=50,  blank=True, null=True)
    other_parties       = models.CharField(max_length=50,  blank=True, null=True)
    residence_since     = models.FloatField(blank=True, null=True)
    property_magnitude  = models.CharField(max_length=50,  blank=True, null=True)
    age                 = models.FloatField(blank=True, null=True)
    other_payment_plans = models.CharField(max_length=50,  blank=True, null=True)
    housing             = models.CharField(max_length=50,  blank=True, null=True)
    existing_credits    = models.FloatField(blank=True, null=True)
    job                 = models.CharField(max_length=100, blank=True, null=True)
    num_dependents      = models.FloatField(blank=True, null=True)
    own_telephone       = models.CharField(max_length=10,  blank=True, null=True)
    foreign_worker      = models.CharField(max_length=10,  blank=True, null=True)

    # Prediction results
    raw_prediction  = models.CharField(max_length=10)   # "good" or "bad"
    risk_level      = models.CharField(max_length=20, choices=RISK_CHOICES)
    risk_color      = models.CharField(max_length=10)   # "green", "yellow", "red"
    confidence      = models.FloatField()
    prob_good       = models.FloatField(default=0)
    prob_bad        = models.FloatField(default=0)

    # AI explanation
    explanation     = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Row {self.row_index} — {self.risk_level} ({self.confidence}%)"

    class Meta:
        ordering = ['row_index']
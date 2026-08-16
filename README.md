# AI-Based Credit Risk Analysis System

An AI-powered credit risk analysis and scoring system designed to help banks and lending institutions evaluate customer creditworthiness quickly, consistently, and transparently.
The system uses a trained **Random Forest machine learning model** to classify customers into **Low Risk, Medium Risk, or High Risk** categories. Unlike traditional black-box credit scoring systems, it integrates **SHAP (SHapley Additive exPlanations)** to explain why a particular prediction was made and which financial or demographic factors influenced the decision.

---

## Overview

Credit risk assessment is one of the most important processes in banking and lending. Traditional credit evaluation can be time-consuming, inconsistent, and heavily dependent on manual review.

This project provides an end-to-end web-based solution that allows bank staff to:

- Upload customer financial datasets
- Automatically process and validate uploaded data
- Predict credit risk using machine learning
- Classify customers into Low, Medium, or High Risk
- Understand individual predictions using SHAP explainability
- View portfolio-level analytics
- Review previous prediction batches
- Generate downloadable Excel reports
- Maintain a history of previous predictions

The system combines a modern React frontend, Django REST API backend, and a Python-based machine learning pipeline.

---

## Key Features

### 📊 Credit Risk Prediction

Upload customer financial data in:

- `.xlsx`
- `.xls`
- `.csv`

The system processes the uploaded dataset and predicts the credit risk category of each customer.

### 🎯 Risk Classification

Each customer is classified into one of three risk categories:

- **Low Risk**
- **Medium Risk**
- **High Risk**

The system also provides model confidence information for predictions.

### 🔍 Explainable AI with SHAP

The system does not simply provide a risk prediction.

Using **SHAP (SHapley Additive exPlanations)**, the system identifies the factors that influenced each customer's prediction.

The Explainability Center provides:

- Risk-increasing factors
- Positive/risk-reducing factors
- Feature impact percentages
- Human-readable explanations
- Top influential features
- Feature impact visualization

This makes the model more transparent and easier for non-technical users to understand.

### 📈 Analytics Dashboard

The dashboard provides portfolio-level insights including:

- Total customers analyzed
- Risk distribution
- Average credit amount
- Average loan duration
- Average model confidence
- Confidence distribution
- Loan purpose analysis
- Customer age distribution

### 📑 Prediction Reports

Previous uploads are stored and can be accessed through the Reports section.

Users can:

- View previous prediction batches
- Review customer-level results
- View upload timestamps
- Access stored prediction information
- Download prediction results as Excel files

### 🗂️ Prediction History

Every uploaded batch is stored with its prediction results, creating an audit trail that allows previous analyses to be reviewed without uploading the same dataset again.

### 🛡️ File Validation

Uploaded files are validated before processing to handle:

- Unsupported file formats
- Missing columns
- Incorrect data structures
- Data type issues
- Missing values

---

## Machine Learning

### Dataset

The model is trained using the **German Credit Dataset**, a well-known benchmark dataset for credit risk analysis.

The dataset contains financial and demographic information about loan applicants, including features such as:

- Checking account status
- Loan duration
- Credit history
- Loan purpose
- Credit amount
- Savings account balance
- Employment duration
- Personal status
- Age
- Housing type
- And other applicant characteristics

---

## Data Preprocessing

Before training, the dataset goes through several preprocessing steps:

1. Data cleaning
2. Missing value handling
3. Categorical feature encoding
4. Numerical feature scaling
5. Feature preparation for model training

Categorical features are processed using encoding techniques, while numerical features are normalized using `StandardScaler`.

Missing numerical values are handled using median imputation.

---

## Model Selection

Three machine learning algorithms were evaluated during development:

1. Logistic Regression
2. Decision Tree
3. Random Forest

Logistic Regression was used as the baseline model.

Decision Tree provided improved performance but showed signs of overfitting.

**Random Forest** provided the best balance between accuracy and generalization and was therefore selected as the final model.

---

## Model Training

The dataset was divided into:

- **80% Training Data**
- **20% Testing Data**

The model was evaluated using standard classification metrics:

- Accuracy
- Precision
- Recall
- F1-Score

The trained Random Forest model is serialized using `joblib` and stored as a `.pkl` file so that the Django backend can load the model during runtime without retraining it.

---

## Explainability

SHAP is integrated into the prediction pipeline using `TreeExplainer`, which is designed for tree-based machine learning models such as Random Forest.

For each customer, SHAP values indicate how individual features influenced the prediction.

The system separates these influences into:

### Risk Factors

Features that increase the customer's risk level.

### Positive Factors

Features that contribute toward a lower-risk prediction.

The system also converts raw feature names into human-readable explanations so that bank staff can understand the results without requiring machine learning knowledge.

---

## System Architecture

The application follows a layered architecture:

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │   TypeScript +       │
                    │     Tailwind CSS     │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │   Django Backend     │
                    │   Django REST        │
                    │     Framework        │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
          ┌─────────────────┐    ┌─────────────────┐
          │ Data Processing │    │   ML Pipeline   │
          │ Pandas / NumPy  │    │ Random Forest   │
          └────────┬────────┘    └────────┬────────┘
                   │                      │
                   │                      ▼
                   │              ┌───────────────┐
                   │              │     SHAP      │
                   │              │ Explainability│
                   │              └───────┬───────┘
                   │                      │
                   └──────────┬───────────┘
                              ▼
                    ┌──────────────────────┐
                    │       SQLite DB      │
                    │ Prediction History   │
                    └──────────────────────┘
```

```
Workflow

User Uploads Dataset
        ↓
React Frontend
        ↓
Django REST API
        ↓
File Validation
        ↓
Data Preprocessing
        ↓
Random Forest Model
        ↓
Risk Prediction
        ↓
SHAP Explainability
        ↓
Store Results in Database
        ↓
Return JSON Response
        ↓
React Dashboard
        ↓
Analytics / Explanation / Reports
```

```
Technology Stack

Layer	Technology
Frontend	React.js
Frontend Language	TypeScript
Styling	Tailwind CSS
Backend	Django
API	Django REST Framework
Machine Learning	Scikit-learn
Data Processing	Pandas
Numerical Computing	NumPy
Explainable AI	SHAP
Excel Processing	OpenPyXL
Database	SQLite
Charts	Recharts
Model Serialization	Joblib
```

API Endpoints

The backend currently exposes the following main endpoints:

Upload Dataset
POST /api/upload/

Accepts an Excel or CSV file, processes the dataset, performs machine learning predictions, calculates SHAP values, stores the results, and returns prediction data.

Analytics
GET /api/analytics/

Returns aggregated analytics for the dashboard, including risk counts, average values, and chart data.

Reports
GET /api/reports/

Returns stored prediction history and customer-level prediction information.

User Interface

The application contains four primary sections:

Upload

Users can upload customer datasets and receive immediate prediction results.

Dashboard

Provides visual analytics and portfolio-level statistics.

Explainability

Allows users to select a batch and individual customer to inspect the factors behind the prediction.

Reports

Displays previous uploads, stored prediction results, and downloadable Excel reports.

Risk Visualization

The interface consistently uses the following risk representation:

Risk Level	Representation
Low Risk	🟢 Green
Medium Risk	🟡 Yellow
High Risk	🔴 Red

This visual system is applied throughout the dashboard and explainability interface.

## How to Run

Follow the steps below to run the project locally.

### Prerequisites

Make sure the following are installed:

- Python 3.x
- Node.js
- npm
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/tahamat1c/Credit-Scoring-Model-AI-based-Risk-Analysis-System
cd <Credit Scoring Model>
```
2. Backend Setup

Navigate to the backend directory:

cd backend

Create a Python virtual environment:

python -m venv venv

Activate the virtual environment.

Windows
venv\Scripts\activate
macOS / Linux
source venv/bin/activate

Install the required Python packages:
pip install -r requirements.txt


3. Database Setup

Run Django migrations:

python manage.py makemigrations
python manage.py migrate

If the project requires a Django superuser, create one using:

python manage.py createsuperuser

Follow the prompts to create the administrator account.

4. Start the Django Backend

Run the Django development server:

python manage.py runserver

The backend will normally be available at:

http://YOUR IP ADDRESS/

. Frontend Setup

Open another terminal and navigate to the frontend directory:

cd frontend

Install the required Node.js dependencies:

npm install

Start the React development server:

npm run dev

The frontend will normally be available at the URL shown in the terminal, commonly:

http://localhost:yyyy/

Login Credentials

The application includes a login page for accessing the system.

Demo Credentials
Username: admin
Password: admin123

Advantages
Fast automated credit risk assessment
Consistent predictions
Explainable AI using SHAP
Customer-level risk analysis
Portfolio-level analytics
Multiple file format support
Downloadable prediction reports
Prediction history and audit trail
User-friendly interface
Human-readable model explanations
Suitable for non-technical banking staff

Future Improvements

The current system provides a complete credit risk analysis workflow. Potential future improvements include:

Migration from SQLite to PostgreSQL for production environments
Authentication and role-based access control
Cloud deployment
Model monitoring
Automated model retraining
Additional machine learning models
Advanced portfolio risk analytics
Real-time prediction APIs
More advanced fairness and bias analysis
Integration with banking systems

Conclusion

The AI-Based Credit Risk Analysis System combines machine learning, explainable AI, and full-stack web development to create a transparent credit risk assessment platform.
The system goes beyond simply predicting whether a customer is risky. By integrating Random Forest with SHAP, it provides insight into the factors behind individual predictions.
With dataset uploading, automated prediction, analytics, explainability, prediction history, and downloadable reports, the project demonstrates how AI can be integrated into a practical financial application while keeping the decision-making process transparent and auditable.

Author
Syed Taha Manzar

This Project was developed for showcasing full-stack machine learning skills, combining a Django backend, React frontend, and explainable AI techniques to solve a real-world credit risk assessment problem.

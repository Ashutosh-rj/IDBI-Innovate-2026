FROM python:3.11-slim
WORKDIR /app
COPY data-generators/sgsdg /app/data-generators/sgsdg
COPY services/scoring-engine /app/services/scoring-engine
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/data-generators/sgsdg/requirements.txt && \
    pip install --no-cache-dir -r /app/services/scoring-engine/requirements.txt
WORKDIR /app/services/scoring-engine
EXPOSE 8000
ENV PYTHONPATH=/app/data-generators/sgsdg:/app/services/scoring-engine:/app/services/scoring-engine/app
ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

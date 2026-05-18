TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXN1cGVyYWRtaW4tMDAxIiwiZW1haWwiOiI0ZS1hZG1pbkBwcm90b24ubWUiLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJzY2hvb2xJZCI6Imdsb2JhbCIsImRpc3RyaWN0SWQiOiJnbG9iYWwiLCJ0ZW5hbnRJZCI6Imdsb2JhbCIsImZpcnN0TmFtZSI6IjRFIiwibGFzdE5hbWUiOiJBZG1pbiIsImlhdCI6MTc3OTA3MDQ3OCwiZXhwIjoxNzc5MDc0MDc4fQ.fiaN4rDxDEezxbKzBH2CsXqFyCWpzYsuV0Cc7K3B43M"

echo "--- Worker ---"
EMAIL2="test+teacher+$(date +%s)_worker@example.test"
curl -v -i -X POST "https://4e-hub-cf.4e-hub.workers.dev/api/admin/teachers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Test Teacher\",\"email\":\"$EMAIL2\",\"password\":\"Password123!\",\"schoolIds\":[\"edb39877-ff9e-4878-9de8-085cfff707e5\"]}"

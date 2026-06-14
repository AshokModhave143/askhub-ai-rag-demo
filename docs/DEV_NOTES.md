Test user: t4@demo.com / Passw0rd!

## script to register user for testing

curl -s -X POST http://localhost:3001/api/auth/register \
 -H "Content-Type: application/json" \
 -d '{"email":"admin@askhub.dev","password":"Admin1234!","name":"Admin"}'

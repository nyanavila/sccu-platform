FROM docker.io/openbankproject/obp-api

# Create props directory
RUN mkdir -p /obp/props

# Write the props file directly into the image
RUN echo "hostname=http://0.0.0.0:8080\n\
base_url=http://0.0.0.0:8080\n\
http.port=8080\n\
http.host=0.0.0.0\n\
connector=mapped\n\
db.driver=org.postgresql.Driver\n\
db.url=jdbc:postgresql://sccu-db:5432/sccu\n\
db.user=sccu_admin\n\
db.password=Sccu2026#DB\n\
redis_address=sccu-redis\n\
redis_port=6379\n\
redis.timeout=60000\n\
redis.maxTotal=128\n\
redis.maxIdle=64\n\
redis.minIdle=16\n\
redis.testOnBorrow=true\n\
redis.testWhileIdle=true\n\
redis.blockWhenExhausted=false\n\
super_admin_user_name=nyanavila_20\n\
allow_entitlement_creation=true\n\
require_scopes_for_all_roles=false\n\
consumer_registration_requires_login=false" > /obp/props/default.props


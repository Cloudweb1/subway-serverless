prisma generate
sam build --manifest package.json

cp -r node_modules/.prisma/client/schema.prisma .aws-sam/build/StationsFunction
cp -r node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node .aws-sam/build/StationsFunction
cp -r .env .aws-sam/build/StationsFunction 

cp -r node_modules/.prisma/client/schema.prisma .aws-sam/build/CongestionsFunction
cp -r node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node .aws-sam/build/CongestionsFunction
cp -r .env .aws-sam/build/CongestionsFunction 

cp -r node_modules/.prisma/client/schema.prisma .aws-sam/build/ArrivalsFunction
cp -r node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node .aws-sam/build/ArrivalsFunction
cp -r .env .aws-sam/build/ArrivalsFunction 

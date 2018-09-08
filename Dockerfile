FROM node:slim
WORKDIR /workspace
RUN apt-get update && apt-get install -y wget bzip2 timidity lame
RUN wget http://lilypond.org/download/binaries/linux-64/lilypond-2.18.2-1.linux-64.sh && chmod u+x lilypond-2.18.2-1.linux-64.sh && ./lilypond-2.18.2-1.linux-64.sh
COPY . /workspace
RUN npm i
RUN npm i -g typescript
RUN npm run build
RUN npm uninstall -g typescript
EXPOSE 3000
CMD npm start

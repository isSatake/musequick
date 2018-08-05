FROM node:slim
WORKDIR /workspace
RUN apt-get update && apt-get install -y wget bzip2 imagemagick timidity lame 
RUN wget http://lilypond.org/download/binaries/linux-64/lilypond-2.18.2-1.linux-64.sh && chmod u+x lilypond-2.18.2-1.linux-64.sh && ./lilypond-2.18.2-1.linux-64.sh
COPY . /workspace
RUN npm i
RUN npm run build
ENV PORT 3000
ENV PATH_LILYPOND lilypond
ENV PATH_CONVERT convert
ENV PATH_TIMIDITY timidity
ENV PATH_LAME lame
EXPOSE 3000
CMD npm start

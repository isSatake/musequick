build:
	docker build . -t musequick
run: build
	docker run -p 3000:3000 musequick
deploy:
	heroku container:push web -a musequick
	heroku container:release web -a musequick
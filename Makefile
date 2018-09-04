build:
	docker build . -t musequick
run: build
	docker run -p 3000:3000 musequick
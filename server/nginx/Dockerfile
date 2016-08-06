FROM golang

# Copy the local package files to the container's workspace.
ADD . /go/src/bitbucket.org/basilboli/boomer/server

# manage dependencies
RUN go install bitbucket.org/basilboli/boomer/server

WORKDIR /go/src/bitbucket.org/basilboli/boomer/server

EXPOSE 3000

ENTRYPOINT /go/bin/server

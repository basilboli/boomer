FROM golang

# Copy the local package files to the container's workspace.
ADD . /go/src/bitbucket.org/basilboli/boomer/server/websockets

# manage dependencies
RUN go install bitbucket.org/basilboli/boomer/server/websockets

WORKDIR /go/src/bitbucket.org/basilboli/boomer/server/websockets

EXPOSE 3000

ENTRYPOINT /go/bin/websockets

FROM golang:1.7

# Copy the local package files to the container's workspace.
ADD backend /go/src/github.com/basilboli/boomer/backend

ADD frontend/www /srv/docroot

# manage dependencies
# RUN go install -ldflags "-X main.BuildStamp=`date -u '+%Y-%m-%d_%I:%M:%S%p'`-githash:`git rev-parse HEAD`" github.com/basilboli/boomer/backend
RUN go install github.com/basilboli/boomer/backend

WORKDIR /go/src/github.com/basilboli/boomer/backend

EXPOSE 3000

VOLUME ["/srv/docroot"]

ENTRYPOINT /go/bin/backend

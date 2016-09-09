FROM golang:1.7

# Copy the local package files to the container's workspace.
ADD . /go/src/bitbucket.org/basilboli/boomer/backend

# manage dependencies
# RUN go install -ldflags "-X main.BuildStamp=`date -u '+%Y-%m-%d_%I:%M:%S%p'`-githash:`git rev-parse HEAD`" bitbucket.org/basilboli/boomer/backend
RUN go install -ldflags "-X main.BuildStamp=`date -u '+%Y-%m-%d_%I:%M:%S%p'`" bitbucket.org/basilboli/boomer/backend

WORKDIR /go/src/bitbucket.org/basilboli/boomer/backend

EXPOSE 3000

ENTRYPOINT /go/bin/backend

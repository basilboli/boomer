# Copyright 2016 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

all:

TAG = 0.0.14
LATEST = latest
PREFIX = gcr.io/boomer-1470064436690
NAME = nginx

build:
	docker build -t $(PREFIX)/$(NAME):$(TAG) .

push: build
	gcloud docker push $(PREFIX)/$(NAME):$(TAG)

pushOnly: 
	gcloud docker push $(PREFIX)/$(NAME):$(TAG)

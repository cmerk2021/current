FROM alpine:3.20

ARG PB_VERSION=0.31.0
ARG TARGETARCH

RUN apk add --no-cache ca-certificates unzip wget \
 && case "${TARGETARCH:-amd64}" in \
      amd64) PB_ARCH=amd64 ;; \
      arm64) PB_ARCH=arm64 ;; \
      arm)   PB_ARCH=armv7 ;; \
      *)     PB_ARCH=amd64 ;; \
    esac \
 && wget -q -O /tmp/pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" \
 && unzip /tmp/pb.zip -d /pb && rm /tmp/pb.zip \
 && chmod +x /pb/pocketbase

WORKDIR /pb
EXPOSE 8090
VOLUME ["/pb/pb_data"]

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]

# html2pdf
HTTP Service to convert HTML to PDF. This image is based off werkspot/html2pdf. We used alpine linux instead of ubuntu to drasticly decrease the container size.
It is called export, but is actually a converter. this was done to remove cognitive load for our developers, as all our services are called exporter.

It was designed to run as a microservice. So make sure that you have a security layer to encrypt the traffic.

# Build
```
docker build -t scienta/html-pdf-export .
```

# Run
```
docker run -it --rm -p 8000:8000 scienta/html-pdf-export
```

# How to use it
```
curl http://localhost:8000 --data @file.html > file.pdf
```
More examples on [/examples](/examples).

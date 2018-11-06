import urllib2;

url = "http://localhost:8000"
html = "<h1>Hello world from Python<h1>"
file = "test.pdf"

pdf = urllib2.urlopen(url, html).read()
open(file, "w").write(pdf)

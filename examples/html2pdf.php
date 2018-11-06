<?php

$url = 'http://localhost:8000';
$html = '<h1>Hello world from PHP</h1>';
$file = 'test.pdf';

$pdf = simple_curl_post($url, $html);
file_put_contents($file, $pdf);

function simple_curl_post($url, $body)
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}

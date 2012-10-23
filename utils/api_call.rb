require 'net/http'
require 'open-uri'
require 'json'

SLEEP_TIME = 1.0 / 10.0

# just calls the given url and returns json-formatted
def get_json(url)
    begin
        JSON.parse(Net::HTTP.get_response(URI.parse(url)).body)
    rescue Exception => e
        print e
        return ''
    end
end

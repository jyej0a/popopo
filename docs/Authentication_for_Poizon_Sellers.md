Authentication for Poizon Sellers
Step 1: Create Your App
1. Log In: Ensure you are logged in to your POIZON Open Platform account.

2. Navigate to App Creation: Go to the Console and create your app.

3. Create Your App: Fill in the required details and submit to create your app.

node-common/b1dda8a7bfe6b632674139a590146fb4.png

Step 2: Apply for API Permissions
1. Access API Permissions: Once your app is created, navigate to the "API Permission Package" tab on your application's detail page.

2. Select Permissions: Apply for the specific API permission package that suits your needs.

node-common/7b30ef4b7554622ec5e6a280228f86ed.png

Step 3: Obtain Your App Key and App Secret
1. Go to Application Info: On your application's detail page, navigate to the "Application Info" tab.

2. Copy Credentials: Copy your App Key and App Secret from this tab.

node-common/6a3f9377122ce2ed101d97a0614c3958.pngWith your App Key and App Secret, you are now ready to start using the POIZON APIs.

Step 4: Generate Your Signature
1. Signature Generation Method

First, set all the data to be sent as a JSON object, add appKey and timestamp (current timestamp in milliseconds) to this JSON object, then sort the parameters with non-empty keys in the JSON object in ascending order based on ASCII value (lexicographical order). Use URL key-value pair format (i.e., a=a&b=b…) to concatenate into a string called stringA. Pay special attention to the following important rules:
Parameter names are sorted in ascending order based on ASCII values (lexicographical order)
If a parameter's value is empty, it does not participate in the signature.
Parameter names and values are case-sensitive.
Parameter values need to be URL-encoded (UTF-8 encoded).
If a parameter value is a JSON array, concatenate the JSON objects in the array with commas to form the parameter value.
When concatenating key and value, use Java's URLEncoder.encode(), reference: URLEncoder.encode(String.valueOf(key), Charsets.UTF_8.name()) + "=" + URLEncoder.encode(String.valueOf(value), Charsets.UTF_8.name()) + "&"
Then, append appSecret to the end of stringA to get the stringSignTemp string. Perform MD5 (32-bit) calculation on stringSignTemp, and convert all characters of the resulting string to uppercase to obtain the sign value.
Signature Example: Request parameters before signing:

{
  "app_key":"4d1715e032c44b709ef4954ef13e0950",
  "appoint_no":"A14343543654",
  "sku_list":[
      {
          "spu_id":81293,
          "sku_id":487752589,
          "bar_code":"487752589",
          "article_number":"wucaishi",
          "appoint_num":10,
          "brand_id":10444,
          "category_id":46
      },
      {
          "spu_id":81293,
          "sku_id":487752589,
          "bar_code":"487752589",
          "article_number":"wucaishi",
          "appoint_num":10,
          "brand_id":10444,
          "category_id":46
      }
  ],
  "timestamp":1603354338917
}
Signature String:

app_key=4d1715e032c44b709ef4954ef13e0950&appoint_no=A14343543654&sku_list=%7B%22spu_id%22%3A81293%2C%22sku_id%22%3A487752589%2C%22bar_code%22%3A%22487752589%22%2C%22article_number%22%3A%22wucaishi%22%2C%22appoint_num%22%3A10%2C%22brand_id%22%3A10444%2C%22category_id%22%3A46%7D%2C%7B%22spu_id%22%3A81293%2C%22sku_id%22%3A487752589%2C%22bar_code%22%3A%22487752589%22%2C%22article_number%22%3A%22wucaishi%22%2C%22appoint_num%22%3A10%2C%22brand_id%22%3A10444%2C%22category_id%22%3A46%7D×tamp=1603353500369fb91e9e96f054166b567eec1b170ae2b
Signature Result:

A0BC221AB4EF5190EFD7D593566C6747


2. Signature References
Java
package com.dewu.sdk.base.util;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.*;

/**
 * @Description: Signer
 * @Author: fengping
 * @Date: 2020/5/26
 */
@Slf4j
public class Signer {

    /**
     * Generates MD5 signature (supports up to two layers)
     * @param params Parameter map
     * @param secret Application secret
     * @return Generated signature
     */
    public String createSign(Map<String, Object> params, String secret) {
        // Remove 'secret' parameter
        if (params.containsKey("secret")) {
            params.remove("secret");
        }
        // Convert map to string
        String paramsString = JsonUtil.obj2String(params);
        // Convert parameter string to sorted map
        TreeMap<String, String> treeMap = jsonToMap(paramsString);
        // Generate signature
        String sign = getSign(treeMap, secret);
        return sign;
    }

    /**
     * Converts parameter string to sorted map
     * @param formData Parameter string
     * @return Sorted map of parameters
     */
    public static TreeMap<String, String> jsonToMap(String formData) {
        TreeMap<String, String> reqParams = new TreeMap<>();
        // Convert JSON request to jsonObject
        JsonNode jsonNode = JsonUtil.readTree(formData);
        // Get json and iterate
        Iterator<Map.Entry<String, JsonNode>> entryIterator = jsonNode.fields();
        List<Map.Entry<String, JsonNode>> entries = copyIterator(entryIterator);
        entries.forEach(jNode -> {
            StringBuffer value = new StringBuffer();
            // If value is an array
            if (jNode.getValue().isArray()) {
                // Get all elements of the array
                Iterator<JsonNode> elements = jNode.getValue().elements();
                List<JsonNode> jsonNodeList = copyIterator(elements);
                for(JsonNode node : jsonNodeList){
                    if(node.isTextual()){
                        value.append(node.asText()).append(",");
                    }else{
                        value.append(node.toString()).append(",");
                    }
                }
                value.deleteCharAt(value.length()-1);
            } else {
                // If element value is string, get the value directly
                if (jNode.getValue().isTextual()){
                    value = value.append(jNode.getValue().asText());
                }else if (jNode != null) {
                    // Convert value to string
                    value = value.append(jNode.getValue().toString());
                }
            }
            reqParams.putIfAbsent(jNode.getKey(), value.toString());
        });
        return reqParams;
    }

    public static <T> List<T> copyIterator(Iterator<T> iter) {
        List<T> copy = new ArrayList<T>();
        while (iter.hasNext()) {
            copy.add(iter.next());
        }
        return copy;
    }

    /**
     * Concatenates parameter string for MD5 encryption to generate signature
     * @param reqParams Sorted parameters
     * @param secret Application secret
     * @return Generated signature
     */
    public String getSign(TreeMap<String, String> reqParams, String secret) {
        String sortedKvStr = reqParams.entrySet().stream().map(entry -> {
            try {
                return URLEncoder.encode(String.valueOf(entry.getKey()), "UTF-8") + "="
                        + URLEncoder.encode(String.valueOf(entry.getValue()), "UTF-8") + "&";
            } catch (UnsupportedEncodingException e) {
                throw new RuntimeException(e);
            }
        }).reduce("", String::concat);
        sortedKvStr = sortedKvStr.substring(0, sortedKvStr.length() - 1) + secret;
        String sign = MD5Util.getMD5Str(sortedKvStr).toUpperCase();
        log.info("Generated signature, signature string:{}, signature result:{}", sortedKvStr, sign);
        return sign;
    }
}
PHP
/**
 * Generate signature
 * @param $paramArr
 * @return string
 */
private function createSign($paramArr) {
  ksort($paramArr);
  foreach($paramArr as $key => $val) { // Filter empty data items
    if(is_array($val)) {
      $paramArr[$key] = json_encode($val, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
  }
  $sign_str = http_build_query($paramArr, NULL, '&');
  $sign_str .= $this->appSecret;
  return strtoupper(md5($sign_str));
}
Node.js
/**
 * Signature algorithm
 */
private sign(data = {}) {
  data.timestamp = Date.now()
  data.app_key = DE_WU_OPEN.dewuAppkey
  let paramsStr =
    Object.keys(data)
      .sort()
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&') + `${DE_WU_OPEN.dewuAppsecret}`
  paramsStr = paramsStr.replace(/%20/gi, '+')
  data.sign = CryptoUtil.md5(paramsStr).toUpperCase()
  console.log(JSON.stringify(data))
  console.log(paramsStr)
  return data
}
C#
protected string GetSign(Dictionary<string, object> parameters)
{
    if (parameters == null || !parameters.Any())
    {
        return string.Empty;
    }
    var sort = new SortedDictionary<string, object>(parameters);
    parameters = sort.ToDictionary(k => k.Key, v => v.Value);
    var parame = new Dictionary<string, object>();
    foreach (var kv in parameters)
    {
        var key = UrlHelper.ToUrlEncode(kv.Key, Encoding.UTF8);
        var value = UrlHelper.ToUrlEncode(kv.Value.ToString(), Encoding.UTF8);
        parame.Add(key, value);
    }
    var str = SignHelper.BuildSignStr(parame, EncryptParmSplicingMode.KeyEqualValWithAnd);
    str += AppSecret;
    return Security.EncryptMD5(str);
}

/// UrlEncode encoding (used for differences in Java and C# encoding)
/// <param name="str">The character to be processed</param>
/// <param name="encoding">Type</param>
/// <returns></returns>
public static string ToUrlEncode(string str, Encoding encoding)
{
    if (encoding == null)
    {
        encoding = UTF8Encoding.UTF8;
    }
    byte[] bytes = encoding.GetBytes(str);
    int num = 0;
    int num2 = 0;

    for (int i = 0; i < bytes.Length; i++)
    {
        char ch = (char)bytes[i];
        if (ch == ' ')
        {
            num++;
        }
        else if (!IsUrlSafeChar(ch))
        {
            num2++;  //Non-url safe character
        }
    }
    if (num == 0 && num2 == 0)
    {
        return str;  //Does not include spaces and special characters

    byte[] buffer = new byte[bytes.Length + (num2 * 2)];  //Contains special characters, each special character is converted to 3 characters, so the length +2x
    int num3 = 0;
    for (int j = 0; j < bytes.Length; j++)
    {
        byte num6 = bytes[j];
        char ch2 = (char)num6;
        if (IsUrlSafeChar(ch2))
        {
            buffer[num3++] = num6;
        }
        else if (ch2 == ' ')
        {
            buffer[num3++] = 0x2B;  //0x2B means + in ASCII, and space is written as + in URL encoding
        }
        else
        {
            //Special symbol conversion
            buffer[num3++] = 0x25;  //Represent  %
            buffer[num3++] = (byte)IntToHex((num6 >> 4) & 15);   //8 bits move right by four bits and 1111 bitwise AND, that is, retain the high front four bits, such as / is 2f, so the result retains 2
            buffer[num3++] = (byte)IntToHex(num6 & 15);   //8 bits, and with 00001111 bitwise AND, that is, retain the last four bits, such as / is 2f, so the result retains f

        }
    }
    return encoding.GetString(buffer);
}

private static bool IsUrlSafeChar(char ch)
{
    if ((((ch < 'a') || (ch > 'z')) && ((ch < 'A') || (ch > 'Z'))) && ((ch < '0') || (ch > '9')))
    {
        switch (ch)
        {
            case '(':
            case ')':
            case '*':
            case '-':
            case '.':
            case '!':
                break;  //Safe character

            case '+':
            case ',':
                return false;  //Non-safe character
            default:   //Non-safe character
                if (ch != '_')
                {
                    return false;
                }
                break;
        }
    }
    return true;
}

private static char IntToHex(int n)   //n is 0-f 
{
    if (n <= 9)
    {
        return (char)(n + 0x30);  //0x30 decimal 48 corresponding ASCII code is 0  
    }
    return (char)((n - 10) + 0x41);   //0x41 decimal 65 corresponding ASCII code is A 
}
Python
def calculate_sign(self, key_dict: dict):
    # Get sorted key list
    sort_key_list = sorted(list(key_dict.keys()))
    new_str = ""
    prams = {}
    for key in sort_key_list:
        value = key_dict.get(key)
        prams[key] = getStr(value)
        valueStr = quote_plus(prams[key], 'utf-8')
        new_str = new_str + key + "=" + valueStr + "&"
    # Remove the last '&' in the string slice
    new_key = new_str[:-1] + self.app_secret
    # Calculate the md5 value and convert all letters to uppercase
    m = hashlib.md5()
    m.update(new_key.encode('UTF-8'))
    sign = m.hexdigest().upper()
    return sign, new_str[:-1]

def getStr(obj, isSub=False):
    valueStr = ''
    if isinstance(obj, (list, tuple)):
        if isinstance(obj[0], str):
            return ','.join(x for x in obj)
        valueStr = ','.join(getStr(x, True) for x in obj)
        # Nested dict under list needs to be added []
        if isSub:
            valueStr = '[' + valueStr + ']'
    elif isinstance(obj, dict):
        valueStr += "{"
        for subObj in sorted(list(obj.keys())):
            valueStr += "\"" + subObj + "\":"
            valueStr += getStr(obj.get(subObj), True) + ","
        valueStr = valueStr[:-1] + "}"
    elif isinstance(obj, set):
        obj = sorted(list(obj))
        return getStr(obj, True)        
    elif isinstance(obj, str) and isSub:
        valueStr = "\"" + obj + "\""
    else:
        valueStr = str(obj)
    return valueStr

# Rewrite the __str__(self) method of custom objects: return: return writeObject2String(self)
def writeObject2String(obj):
    '''Convert custom objects to str'''
    # Use vars() function to get all custom field names and their corresponding values of the object
    attributes_and_values = {k: v for k, v in vars(obj).items() if not k.startswith("__")}
    string = "{"
    for k, v in attributes_and_values.items():
        string += "\"" + k + "\":" + getStr(v, True) + ","
    string = string[:-1] + "}"
    return string
If you have any questions or need further assistance, feel free to reach out to our support team via poizon.open.platform@poizon.com.
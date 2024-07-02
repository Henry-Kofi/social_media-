
export const  customResponseCodes = {
    /** 
     * `9011` For sucessful operations. Send with a `200` or respective success status code
     */
    SUCCESSFUL: 9011,
    /** 
     * `9012` For unsucessful operations. Send with a `404` or respective unsuccessful status code
     */
    UNSUCCESSFUL: 9012,
    /**
     * `9013` For unauthorized access. Send with a `401`
     */
    UNAUTHORIZED: 9013,
    /**
     * `9014` For client errors. Send with a respective `4xx` status code. 
     */
    CLIENT_ERR: 9014,
    /**
     * `9015` For server errors. Send with a `503` status code. 
     * This is normally a problem encountered on server and is server's fault. 
     * Users are not supposed to know server is down or encountered errors while processing request. 
     * Hence, `503` is the nearest status code for this situation. 
     * 
     * On client side, response code `9015` shall consider the situation and give appropriate feedback to users.
     */
    SERVER_ERR: 9015,
    
};
export const customResponseCodeNames: {[k:number]:keyof typeof customResponseCodes} = {};

// Set error names dynamically
(function(){

    let errorCode: number;
    let errorName : keyof typeof customResponseCodes;
    for( errorName in customResponseCodes){
        errorCode = customResponseCodes[errorName];
        customResponseCodeNames[errorCode] = errorName;
    }

})();


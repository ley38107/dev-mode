/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"errors"
	"fmt"
	"strconv"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ABstore Chaincode implementation
type ABstore struct {
	contractapi.Contract
}

func (t *ABstore) InitUser(ctx contractapi.TransactionContextInterface, user string, value string) error {
	exists, err := ctx.GetStub().GetState(user)
	if err != nil {
		return fmt.Errorf("상태 조회 실패: %v", err)
	}
	if exists != nil {
		return fmt.Errorf("이미 존재하는 사용자입니다")
	}

	err = ctx.GetStub().PutState(user, []byte(value))
	if err != nil {
		return fmt.Errorf("초기값 저장 실패: %v", err)
	}
	return nil
}

func main() {
	cc, err := contractapi.NewChaincode(new(ABstore))
	if err != nil {
		panic(err.Error())
	}
	if err := cc.Start(); err != nil {
		fmt.Printf("Error starting ABstore chaincode: %s", err)
	}
}
